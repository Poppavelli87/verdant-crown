import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";
import { DamageSystem, ENEMY_STAGGER_SECONDS } from "./damageSystem.js";
import { ENEMY_STATES, Enemy } from "./enemy.js";
import { onEnemyKilled as buildEnemyKilledEvent } from "./onEnemyKilled.js";
import { STATUS_EFFECT_IDS } from "./statusEffects.js";

const COMBAT_LINGER_SECONDS = 2.5;
const AGGRO_DISENGAGE_MULTIPLIER = 1.45;
const ORB_COLLECT_RADIUS = 0.32;
const ORB_FLOAT_HEIGHT = 0.12;
const CONSTRUCT_PROJECTILE_RADIUS = 0.14;
const PLAYER_PROJECTILE_HIT_RADIUS = 0.28;
const THREAT_TARGET_LOCK_SECONDS = 0.5;
const STRIKER_DASH_HIT_RADIUS = 0.38;
const HEXER_DEBUFF_SECONDS = 6;
const HEXER_CAST_RANGE = 4.1;
const BULWARK_HEXER_PROTECT_RADIUS = 2.4;

function disposeObject3D(object3D) {
  object3D.traverse((child) => {
    if (child.geometry && typeof child.geometry.dispose === "function") {
      child.geometry.dispose();
    }
    const material = child.material;
    if (Array.isArray(material)) {
      for (const entry of material) {
        entry?.dispose?.();
      }
    } else {
      material?.dispose?.();
    }
  });
}

// CombatSystem owns scene-local enemies, combat flow state, and loot orb lifecycle.
export class CombatSystem {
  constructor({
    threeScene,
    damageSystem = new DamageSystem(),
    devMode = false,
    damageResolver = null,
    onEnemyKilled = null,
  }) {
    this.threeScene = threeScene;
    this.damageSystem = damageSystem;
    this.devMode = devMode;

    this.root = new THREE.Group();
    this.root.name = "combat-root";
    this.threeScene.add(this.root);

    this.currentSceneId = null;
    this.enemies = [];
    this.lootOrbs = [];
    this.enemyProjectiles = [];
    this.enemyCounter = 0;

    this.elapsedSeconds = 0;
    this.combatLingerRemaining = 0;
    this.combatActive = false;
    this.enemyAttacksEnabled = true;
    this.damageResolver = typeof damageResolver === "function" ? damageResolver : null;
    this.onEnemyKilled = typeof onEnemyKilled === "function" ? onEnemyKilled : null;

    this.lootCollected = 0;
    this.totalEnemiesDefeated = 0;
  }

  setDamageResolver(resolver) {
    this.damageResolver = typeof resolver === "function" ? resolver : null;
  }

  setOnEnemyKilled(callback) {
    this.onEnemyKilled = typeof callback === "function" ? callback : null;
  }

  _resolveDamageAmount({
    baseDamage,
    attackerId = "",
    targetId = "",
    attackType = "light",
    damageType = "physical",
    source = "combat",
    consumeStatusCharges = true,
    attackEvent = null,
    target = null,
  }) {
    const numericBase = Math.max(0, Number(baseDamage) || 0);
    if (!this.damageResolver) return numericBase;
    const resolved =
      this.damageResolver({
        baseDamage: numericBase,
        attackerId: String(attackerId ?? ""),
        targetId: String(targetId ?? ""),
        attackType,
        damageType,
        source,
        consumeStatusCharges,
        attackEvent,
        target,
      }) ?? numericBase;
    return Math.max(0, Number(resolved) || 0);
  }

  _recordLastDamager(enemy, attackerId = "") {
    if (!enemy) return;
    const resolvedAttackerId = String(attackerId ?? "").trim();
    if (!resolvedAttackerId) return;
    enemy.lastDamagerId = resolvedAttackerId;
  }

  _finalizeEnemyDeath(enemy, { source = "combat", attackType = "", damageType = "", onEnemyKilled = null } = {}) {
    if (!enemy || enemy.state === ENEMY_STATES.DEAD) return null;
    enemy.markDead();
    this.totalEnemiesDefeated += 1;
    this._spawnLootOrb(enemy.position);

    const killEvent = buildEnemyKilledEvent(enemy.lastDamagerId, enemy.id, {
      source,
      attackType,
      damageType,
      enemyRole: enemy.role,
      enemyType: enemy.type,
      sceneId: this.currentSceneId,
      elapsedSeconds: this.elapsedSeconds,
    });
    const callback = typeof onEnemyKilled === "function" ? onEnemyKilled : this.onEnemyKilled;
    callback?.(killEvent);
    return killEvent;
  }

  _normalizeThreatTargets(playerPosition, threatTargets = null) {
    const list = [];
    if (Array.isArray(threatTargets)) {
      for (const candidate of threatTargets) {
        if (!candidate) continue;
        const id = String(candidate.id ?? "").trim();
        const x = Number(candidate.x);
        const z = Number(candidate.z);
        if (!id || !Number.isFinite(x) || !Number.isFinite(z)) continue;
        if (candidate.alive === false) continue;
        const hp = Math.max(0, Number(candidate.hp) || 0);
        const maxHp = Math.max(1, Number(candidate.maxHp) || 1);
        const effectiveHp = Number.isFinite(Number(candidate.effectiveHp))
          ? Math.max(0, Number(candidate.effectiveHp))
          : hp;
        list.push({
          id,
          x,
          z,
          hp,
          maxHp,
          effectiveHp,
          defense: Math.max(0.1, Number(candidate.defense) || 1),
          threatScore: Math.max(0, Number(candidate.threatScore) || 1),
          hexPriority: Math.max(0, Number(candidate.hexPriority) || 0),
          squishy: Boolean(candidate.squishy),
          active: Boolean(candidate.active),
        });
      }
    }
    if (list.length === 0) {
      list.push({
        id: "arthur",
        x: Number(playerPosition?.x) || 0,
        z: Number(playerPosition?.z) || 0,
        hp: 100,
        maxHp: 100,
        effectiveHp: 100,
        defense: 1,
        threatScore: 1,
        hexPriority: 0,
        squishy: false,
        active: true,
      });
    }
    list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
    return list;
  }

  _getThreatTargetById(threatTargets, targetId) {
    const wanted = String(targetId ?? "");
    if (!wanted) return null;
    return threatTargets.find((entry) => entry.id === wanted) ?? null;
  }

  _selectThreatTarget(enemy, threatTargets = []) {
    if (!enemy || !Array.isArray(threatTargets) || threatTargets.length === 0) {
      return null;
    }
    if (enemy.currentTargetId && enemy.targetLockRemaining > 0) {
      const retained = this._getThreatTargetById(threatTargets, enemy.currentTargetId);
      if (retained) return retained;
    }

    const scored = threatTargets.map((target) => {
      const distance = Math.hypot(target.x - enemy.position.x, target.z - enemy.position.y);
      let score = target.threatScore - distance * 0.55;
      if (enemy.role === "striker") {
        const hpPressure = (target.effectiveHp / Math.max(1, target.maxHp)) * 1.25;
        score += (target.squishy ? 1.35 : -0.35) - hpPressure;
      } else if (enemy.role === "hexer") {
        score += target.hexPriority * 1.15 - target.defense * 0.35;
      } else if (enemy.role === "bulwark") {
        score += target.active ? 0.22 : 0;
      }
      return {
        target,
        score,
        distance,
      };
    });
    scored.sort((left, right) => {
      if (Math.abs(right.score - left.score) > 1e-6) return right.score - left.score;
      if (Math.abs(left.distance - right.distance) > 1e-6) return left.distance - right.distance;
      return String(left.target.id).localeCompare(String(right.target.id));
    });

    let selectedEntry = scored[0] ?? null;
    if (enemy.role === "striker") {
      const bestSquishy = scored
        .filter((entry) => entry.target.squishy)
        .sort((left, right) => {
          const leftHpRatio = left.target.effectiveHp / Math.max(1, left.target.maxHp);
          const rightHpRatio = right.target.effectiveHp / Math.max(1, right.target.maxHp);
          if (Math.abs(leftHpRatio - rightHpRatio) > 1e-6) return leftHpRatio - rightHpRatio;
          if (Math.abs(right.score - left.score) > 1e-6) return right.score - left.score;
          if (Math.abs(left.distance - right.distance) > 1e-6) return left.distance - right.distance;
          return String(left.target.id).localeCompare(String(right.target.id));
        })[0];
      // Strikers favor diving squishy targets whenever the threat gap is close.
      if (bestSquishy && selectedEntry && bestSquishy.score >= selectedEntry.score - 1.2) {
        selectedEntry = bestSquishy;
      }
    }

    const selected = selectedEntry?.target ?? null;
    if (selected) {
      enemy.currentTargetId = selected.id;
      enemy.targetLockRemaining = enemy.role === "striker" ? 1.4 : THREAT_TARGET_LOCK_SECONDS;
    }
    return selected;
  }

  _isBulwarkFrontBlocked(enemy, attackOrigin) {
    if (!enemy || enemy.role !== "bulwark" || !enemy.isShielding || !attackOrigin) return false;
    const toAttacker = new THREE.Vector2(
      Number(attackOrigin.x) - enemy.position.x,
      Number(attackOrigin.z ?? attackOrigin.y) - enemy.position.y
    );
    if (toAttacker.lengthSq() <= 1e-6) return true;
    toAttacker.normalize();
    const facing = enemy.facing.lengthSq() > 1e-6 ? enemy.facing.clone().normalize() : new THREE.Vector2(0, 1);
    return facing.dot(toAttacker) >= enemy.bulwarkShieldConeDot;
  }

  loadScene(sceneId, enemyDefinitions = []) {
    this.clearScene();
    this.currentSceneId = sceneId;
    this.combatLingerRemaining = 0;
    this.combatActive = false;

    for (const definition of enemyDefinitions) {
      this._spawnEnemy(definition);
    }
  }

  spawnEnemies(enemyDefinitions = []) {
    const spawnedIds = [];
    for (const definition of enemyDefinitions) {
      const spawnedId = this._spawnEnemy(definition);
      if (spawnedId) {
        spawnedIds.push(spawnedId);
      }
    }
    return spawnedIds;
  }

  clearScene() {
    for (const enemy of this.enemies) {
      enemy.dispose(this.root);
    }
    this.enemies.length = 0;

    for (const orb of this.lootOrbs) {
      this.root.remove(orb.mesh);
      disposeObject3D(orb.mesh);
    }
    this.lootOrbs.length = 0;

    for (const projectile of this.enemyProjectiles) {
      this.root.remove(projectile.mesh);
      disposeObject3D(projectile.mesh);
    }
    this.enemyProjectiles.length = 0;
  }

  _spawnEnemy(definition) {
    const enemy = new Enemy({
      id: definition.id ?? `${this.currentSceneId}-enemy-${this.enemyCounter++}`,
      type: definition.type ?? "standard",
      role: definition.role ?? (definition.type === "ambush" ? "harrier" : "skirmisher"),
      position: new THREE.Vector2(definition.x ?? 0, definition.z ?? 0),
      health: definition.health,
      maxHealth: definition.maxHealth,
      aggroRadius: definition.aggroRadius ?? 2.8,
      attackRange: definition.attackRange ?? 0.9,
      attackCooldown: definition.attackCooldown,
      lingerTag: definition.lingerTag ?? "wild",
      patrolSpan: definition.patrolSpan ?? 0.8,
      patrolSpeed: definition.patrolSpeed,
    });

    enemy.attachToScene(this.root, { debugAggro: this.devMode });
    enemy.setState(ENEMY_STATES.PATROL);
    this.enemies.push(enemy);
    return enemy.id;
  }

  despawnEnemiesByIds(enemyIds = []) {
    if (!Array.isArray(enemyIds) || enemyIds.length === 0) return 0;
    const idSet = new Set(enemyIds);
    let removed = 0;
    for (let i = this.enemies.length - 1; i >= 0; i -= 1) {
      const enemy = this.enemies[i];
      if (!idSet.has(enemy.id)) continue;
      enemy.dispose(this.root);
      this.enemies.splice(i, 1);
      removed += 1;
    }
    return removed;
  }

  countAliveEnemiesByIds(enemyIds = []) {
    if (!Array.isArray(enemyIds) || enemyIds.length === 0) return 0;
    const idSet = new Set(enemyIds);
    let count = 0;
    for (const enemy of this.enemies) {
      if (idSet.has(enemy.id) && enemy.isAlive()) {
        count += 1;
      }
    }
    return count;
  }

  _spawnLootOrb(position) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 10, 10),
      new THREE.MeshStandardMaterial({
        color: "#c4ffd4",
        emissive: "#69f0a8",
        emissiveIntensity: 0.9,
        roughness: 0.4,
      })
    );
    mesh.position.set(position.x, -0.72, position.y);
    this.root.add(mesh);

    this.lootOrbs.push({
      mesh,
      x: position.x,
      z: position.y,
      baseY: -0.72,
      age: 0,
    });
  }

  _updateLootOrbs(dtSeconds, playerPosition) {
    for (let i = this.lootOrbs.length - 1; i >= 0; i -= 1) {
      const orb = this.lootOrbs[i];
      orb.age += dtSeconds;
      orb.mesh.position.y = orb.baseY + ORB_FLOAT_HEIGHT + Math.sin(orb.age * 3.8) * 0.06;
      orb.mesh.rotation.y += dtSeconds * 2.3;

      const distanceToPlayer = Math.hypot(playerPosition.x - orb.x, playerPosition.z - orb.z);
      if (distanceToPlayer <= ORB_COLLECT_RADIUS) {
        this.lootCollected += 1;
        this.root.remove(orb.mesh);
        disposeObject3D(orb.mesh);
        this.lootOrbs.splice(i, 1);
      }
    }
  }

  _spawnEnemyProjectile(enemy, targetPosition, { color = "#b8ffca", targetEntityId = "" } = {}) {
    const direction = new THREE.Vector2(targetPosition.x - enemy.position.x, targetPosition.z - enemy.position.y);
    if (direction.lengthSq() <= 1e-6) {
      direction.copy(enemy.facing);
    }
    if (direction.lengthSq() <= 1e-6) {
      direction.set(0, 1);
    } else {
      direction.normalize();
    }

    const spawnDistance = enemy.collisionRadius + CONSTRUCT_PROJECTILE_RADIUS + 0.08;
    const spawnX = enemy.position.x + direction.x * spawnDistance;
    const spawnZ = enemy.position.y + direction.y * spawnDistance;
    const speed = Math.max(
      1.4,
      Number(enemy.role === "hexer" ? enemy.hexerProjectileSpeed : enemy.constructProjectileSpeed) || 3.4
    );
    const life = Math.max(
      0.25,
      Number(enemy.role === "hexer" ? enemy.hexerProjectileLifetime : enemy.constructProjectileLifetime) || 1.65
    );

    const mesh = new THREE.Sprite(
      new THREE.SpriteMaterial({
        color,
        transparent: true,
        opacity: 0.92,
        depthWrite: false,
      })
    );
    mesh.scale.set(0.18, 0.18, 1);
    mesh.position.set(spawnX, -0.47, spawnZ);
    this.root.add(mesh);

    this.enemyProjectiles.push({
      mesh,
      x: spawnX,
      z: spawnZ,
      vx: direction.x * speed,
      vz: direction.y * speed,
      lifeRemaining: life,
      maxLife: life,
      damage: enemy.attackDamage,
      sourceEnemyId: enemy.id,
      targetEntityId: String(targetEntityId ?? ""),
    });
  }

  _updateEnemyProjectiles(dtSeconds, threatTargets, onPartyDamaged) {
    if (this.enemyProjectiles.length === 0) return 0;
    let damageTaken = 0;

    for (let i = this.enemyProjectiles.length - 1; i >= 0; i -= 1) {
      const projectile = this.enemyProjectiles[i];
      projectile.lifeRemaining = Math.max(0, projectile.lifeRemaining - dtSeconds);
      projectile.x += projectile.vx * dtSeconds;
      projectile.z += projectile.vz * dtSeconds;
      const lifeT = projectile.lifeRemaining / projectile.maxLife;
      projectile.mesh.material.opacity = Math.max(0, Math.min(1, lifeT)) * 0.92;
      projectile.mesh.position.set(
        projectile.x,
        -0.47 + Math.sin((1 - lifeT) * 8.6) * 0.02,
        projectile.z
      );
      projectile.mesh.renderOrder = 1208;

      let hitTarget = null;
      if (projectile.targetEntityId) {
        hitTarget = this._getThreatTargetById(threatTargets, projectile.targetEntityId);
      }
      if (!hitTarget && threatTargets.length > 0) {
        let bestDistance = Number.POSITIVE_INFINITY;
        for (const target of threatTargets) {
          const candidateDistance = Math.hypot(target.x - projectile.x, target.z - projectile.z);
          if (candidateDistance >= bestDistance) continue;
          bestDistance = candidateDistance;
          hitTarget = target;
        }
      }

      if (this.enemyAttacksEnabled && hitTarget) {
        const hitDistance = Math.hypot(hitTarget.x - projectile.x, hitTarget.z - projectile.z);
        if (hitDistance <= PLAYER_PROJECTILE_HIT_RADIUS + CONSTRUCT_PROJECTILE_RADIUS) {
          const outcome =
            onPartyDamaged?.(
              projectile.damage,
              {
                id: projectile.sourceEnemyId,
                position: { x: projectile.x, y: projectile.z },
              },
              hitTarget.id
            ) ?? { damage: projectile.damage };
          damageTaken += outcome.damage ?? 0;
          this.root.remove(projectile.mesh);
          disposeObject3D(projectile.mesh);
          this.enemyProjectiles.splice(i, 1);
          continue;
        }
      }

      if (projectile.lifeRemaining <= 0) {
        this.root.remove(projectile.mesh);
        disposeObject3D(projectile.mesh);
        this.enemyProjectiles.splice(i, 1);
      }
    }

    return damageTaken;
  }

  _runEnemyAi(dtSeconds, enemy, threatTargets, onPartyDamaged, onStatusApplied) {
    if (enemy.state === ENEMY_STATES.DEAD) {
      return { aggro: false, damageTaken: 0 };
    }

    const threatTarget = this._selectThreatTarget(enemy, threatTargets) ?? threatTargets[0] ?? null;
    const targetPosition = threatTarget
      ? { x: threatTarget.x, z: threatTarget.z }
      : { x: enemy.position.x, z: enemy.position.y };
    enemy.currentTargetId = threatTarget?.id ?? enemy.currentTargetId ?? "";
    enemy.specialTargetPosition = threatTarget ? new THREE.Vector2(threatTarget.x, threatTarget.z) : null;

    const toTarget = new THREE.Vector2(targetPosition.x - enemy.position.x, targetPosition.z - enemy.position.y);
    const distanceToTargetRaw = toTarget.length();
    const distanceToTarget = Math.max(0, distanceToTargetRaw - enemy.collisionRadius);
    const hasTargetDirection = distanceToTargetRaw > 1e-5;
    if (hasTargetDirection) {
      toTarget.multiplyScalar(1 / distanceToTargetRaw);
      enemy.facing.copy(toTarget);
    }

    let aggro = false;
    let damageTaken = 0;

    switch (enemy.state) {
      case ENEMY_STATES.IDLE:
      case ENEMY_STATES.PATROL: {
        if (distanceToTarget <= enemy.aggroRadius) {
          if (enemy.type === "ambush") {
            enemy.setState(ENEMY_STATES.ALERT);
          } else {
            enemy.setState(ENEMY_STATES.AGGRO);
          }
          break;
        }

        enemy.setState(ENEMY_STATES.PATROL);
        const nextX = enemy.position.x + enemy.patrolDirection * enemy.patrolSpeed * dtSeconds;
        if (Math.abs(nextX - enemy.spawnPosition.x) > enemy.patrolSpan) {
          enemy.patrolDirection *= -1;
        } else {
          enemy.position.x = nextX;
        }
        enemy.position.y = enemy.spawnPosition.y;
        enemy.facing.set(enemy.patrolDirection, 0).normalize();
        break;
      }
      case ENEMY_STATES.ALERT: {
        if (distanceToTarget <= enemy.aggroRadius * 0.95 || enemy.stateTime >= 0.42) {
          enemy.setState(ENEMY_STATES.AGGRO);
        }
        break;
      }
      case ENEMY_STATES.AGGRO: {
        aggro = true;
        const disengageMultiplier =
          enemy.role === "skirmisher"
            ? 1.8
            : enemy.role === "harrier"
              ? 1.55
              : enemy.role === "hexer"
                ? 1.6
                : 1.3;
        if (distanceToTarget > enemy.aggroRadius * AGGRO_DISENGAGE_MULTIPLIER * disengageMultiplier) {
          enemy.setState(ENEMY_STATES.PATROL);
          break;
        }

        if (enemy.role === "construct") {
          const preferredDistance = enemy.constructPreferredDistance;
          const minDistance = enemy.constructMinDistance;
          if (distanceToTarget > preferredDistance * 1.14 && hasTargetDirection) {
            enemy.position.x += toTarget.x * enemy.moveSpeed * dtSeconds;
            enemy.position.y += toTarget.y * enemy.moveSpeed * dtSeconds;
          } else if (distanceToTarget < minDistance && hasTargetDirection) {
            enemy.position.x -= toTarget.x * enemy.moveSpeed * 0.94 * dtSeconds;
            enemy.position.y -= toTarget.y * enemy.moveSpeed * 0.94 * dtSeconds;
          }
          if (distanceToTarget <= preferredDistance * 1.16) {
            enemy.setState(ENEMY_STATES.ATTACK);
          }
          break;
        }

        if (enemy.role === "hexer") {
          const preferredDistance = enemy.hexerPreferredDistance;
          const minDistance = enemy.hexerMinDistance;
          if (distanceToTarget > preferredDistance * 1.06 && hasTargetDirection) {
            enemy.position.x += toTarget.x * enemy.moveSpeed * dtSeconds;
            enemy.position.y += toTarget.y * enemy.moveSpeed * dtSeconds;
          } else if (distanceToTarget < minDistance && hasTargetDirection) {
            enemy.position.x -= toTarget.x * enemy.moveSpeed * 1.02 * dtSeconds;
            enemy.position.y -= toTarget.y * enemy.moveSpeed * 1.02 * dtSeconds;
          }
          if (distanceToTarget <= HEXER_CAST_RANGE) {
            enemy.setState(ENEMY_STATES.ATTACK);
          }
          break;
        }

        if (enemy.role === "bulwark") {
          const alliedHexer = this.enemies.find(
            (entry) => entry.id !== enemy.id && entry.role === "hexer" && entry.isAlive()
          );
          if (alliedHexer && threatTarget) {
            const shieldDir = new THREE.Vector2(
              threatTarget.x - alliedHexer.position.x,
              threatTarget.z - alliedHexer.position.y
            );
            if (shieldDir.lengthSq() > 1e-6) {
              shieldDir.normalize();
              const guardX = alliedHexer.position.x + shieldDir.x * BULWARK_HEXER_PROTECT_RADIUS;
              const guardZ = alliedHexer.position.y + shieldDir.y * BULWARK_HEXER_PROTECT_RADIUS;
              const toGuard = new THREE.Vector2(guardX - enemy.position.x, guardZ - enemy.position.y);
              if (toGuard.lengthSq() > 1e-6) {
                toGuard.normalize();
                enemy.position.x += toGuard.x * enemy.moveSpeed * dtSeconds;
                enemy.position.y += toGuard.y * enemy.moveSpeed * dtSeconds;
              }
            }
          } else if (hasTargetDirection) {
            enemy.position.x += toTarget.x * enemy.moveSpeed * dtSeconds;
            enemy.position.y += toTarget.y * enemy.moveSpeed * dtSeconds;
          }
          if (
            enemy.specialCooldownRemaining <= 0 &&
            enemy.specialTelegraphRemaining <= 0 &&
            distanceToTarget <= enemy.attackRange * 2.25
          ) {
            enemy.specialAction = "bulwark_shield";
            enemy.specialTargetId = threatTarget?.id ?? "";
            enemy.specialTelegraphDuration = enemy.bulwarkShieldTelegraphSeconds;
            enemy.specialTelegraphRemaining = enemy.bulwarkShieldTelegraphSeconds;
            enemy.setState(ENEMY_STATES.ATTACK);
            break;
          }
          if (distanceToTarget <= enemy.attackRange + 0.05) {
            enemy.setState(ENEMY_STATES.ATTACK);
          }
          break;
        }

        if (enemy.role === "striker") {
          if (
            enemy.specialCooldownRemaining <= 0 &&
            enemy.specialTelegraphRemaining <= 0 &&
            distanceToTarget <= enemy.attackRange * 2.55
          ) {
            enemy.specialAction = "striker_dash";
            enemy.specialTargetId = threatTarget?.id ?? "";
            enemy.specialTelegraphDuration = enemy.strikerDashTelegraphSeconds;
            enemy.specialTelegraphRemaining = enemy.strikerDashTelegraphSeconds;
            enemy.setState(ENEMY_STATES.ATTACK);
            break;
          }
          if (distanceToTarget <= enemy.attackRange + 0.05) {
            enemy.setState(ENEMY_STATES.ATTACK);
            break;
          }
          if (hasTargetDirection) {
            enemy.position.x += toTarget.x * enemy.moveSpeed * 1.08 * dtSeconds;
            enemy.position.y += toTarget.y * enemy.moveSpeed * 1.08 * dtSeconds;
          }
          break;
        }

        if (enemy.role === "harrier") {
          const flank = new THREE.Vector2(-toTarget.y, toTarget.x).multiplyScalar(enemy.flankSide);
          const desiredX =
            targetPosition.x - toTarget.x * enemy.harrierPreferredDistance + flank.x * enemy.flankDistance;
          const desiredZ =
            targetPosition.z - toTarget.y * enemy.harrierPreferredDistance + flank.y * enemy.flankDistance;
          const moveVector = new THREE.Vector2(desiredX - enemy.position.x, desiredZ - enemy.position.y);
          if (distanceToTarget < enemy.harrierMinDistance) {
            moveVector.copy(toTarget).multiplyScalar(-1);
          }
          if (moveVector.lengthSq() > 1e-6) {
            moveVector.normalize();
            enemy.position.x += moveVector.x * enemy.moveSpeed * dtSeconds;
            enemy.position.y += moveVector.y * enemy.moveSpeed * dtSeconds;
            enemy.facing.copy(moveVector);
          }

          if (distanceToTarget <= enemy.attackRange * 1.1 && distanceToTarget >= enemy.harrierMinDistance * 0.9) {
            enemy.setState(ENEMY_STATES.ATTACK);
          }
          break;
        }

        if (enemy.role === "skirmisher" && enemy.isLowHealth() && distanceToTarget < enemy.attackRange * 1.9) {
          enemy.position.x -= toTarget.x * enemy.moveSpeed * 1.4 * dtSeconds;
          enemy.position.y -= toTarget.y * enemy.moveSpeed * 1.4 * dtSeconds;
          enemy.facing.copy(toTarget).multiplyScalar(-1);
          break;
        }

        if (distanceToTarget <= enemy.attackRange) {
          enemy.setState(ENEMY_STATES.ATTACK);
          break;
        }

        if (hasTargetDirection) {
          enemy.position.x += toTarget.x * enemy.moveSpeed * dtSeconds;
          enemy.position.y += toTarget.y * enemy.moveSpeed * dtSeconds;
          enemy.facing.copy(toTarget);
        }
        break;
      }
      case ENEMY_STATES.ATTACK: {
        aggro = true;
        if (enemy.role === "construct") {
          if (
            distanceToTarget > enemy.constructPreferredDistance * 1.5 ||
            distanceToTarget < enemy.constructMinDistance * 0.78
          ) {
            enemy.setState(ENEMY_STATES.AGGRO);
            break;
          }

          if (!this.enemyAttacksEnabled) {
            break;
          }
          if (enemy.staggerRemaining <= 0 && enemy.attackCooldownRemaining <= 0) {
            if (enemy.attackWindupSeconds > 0 && enemy.stateTime < enemy.attackWindupSeconds) {
              break;
            }
            this._spawnEnemyProjectile(enemy, targetPosition, {
              color: "#b8ffca",
              targetEntityId: threatTarget?.id ?? "",
            });
            enemy.markAttackStrike();
            enemy.attackCooldownRemaining = enemy.attackCooldown;
            enemy.setState(ENEMY_STATES.AGGRO);
          }
          break;
        }

        if (enemy.role === "hexer") {
          if (distanceToTarget > HEXER_CAST_RANGE * 1.42) {
            enemy.setState(ENEMY_STATES.AGGRO);
            break;
          }
          if (!this.enemyAttacksEnabled) {
            break;
          }
          if (enemy.specialAction === "hexer_hex") {
            if (enemy.specialTelegraphRemaining > 0) break;
            if (threatTarget?.id) {
              onStatusApplied?.({
                sourceEnemyId: enemy.id,
                targetId: threatTarget.id,
                effectId: STATUS_EFFECT_IDS.HEX_WEAKENED,
                durationSeconds: HEXER_DEBUFF_SECONDS,
              });
            }
            enemy.markAttackStrike();
            enemy.specialAction = "";
            enemy.specialCooldownRemaining = enemy.hexerDebuffCooldown;
            enemy.setState(ENEMY_STATES.AGGRO);
            break;
          }
          if (
            enemy.specialCooldownRemaining <= 0 &&
            enemy.specialTelegraphRemaining <= 0 &&
            enemy.attackCooldownRemaining <= 0
          ) {
            enemy.specialAction = "hexer_hex";
            enemy.specialTargetId = threatTarget?.id ?? "";
            enemy.specialTelegraphDuration = enemy.hexerDebuffTelegraphSeconds;
            enemy.specialTelegraphRemaining = enemy.hexerDebuffTelegraphSeconds;
            break;
          }
          if (enemy.staggerRemaining <= 0 && enemy.attackCooldownRemaining <= 0) {
            if (enemy.attackWindupSeconds > 0 && enemy.stateTime < enemy.attackWindupSeconds) {
              break;
            }
            this._spawnEnemyProjectile(enemy, targetPosition, {
              color: "#92c3ff",
              targetEntityId: threatTarget?.id ?? "",
            });
            enemy.markAttackStrike();
            enemy.attackCooldownRemaining = enemy.attackCooldown;
            enemy.setState(ENEMY_STATES.AGGRO);
          }
          break;
        }

        if (enemy.role === "bulwark" && enemy.specialAction === "bulwark_shield") {
          if (enemy.specialTelegraphRemaining > 0) {
            break;
          }
          enemy.specialAction = "";
          enemy.specialCooldownRemaining = enemy.bulwarkShieldCooldown;
          enemy.shieldActiveRemaining = enemy.bulwarkShieldSeconds;
          enemy.isShielding = true;
          enemy.setState(ENEMY_STATES.AGGRO);
          break;
        }

        if (enemy.role === "striker" && enemy.specialAction === "striker_dash") {
          if (enemy.specialTelegraphRemaining > 0) {
            break;
          }
          if (hasTargetDirection) {
            const dashDistance = Math.min(enemy.strikerDashDistance, distanceToTarget + 0.18);
            enemy.position.x += toTarget.x * dashDistance;
            enemy.position.y += toTarget.y * dashDistance;
          }
          enemy.markAttackStrike();
          if (this.enemyAttacksEnabled && threatTarget) {
            const strikeDistance = Math.hypot(
              threatTarget.x - enemy.position.x,
              threatTarget.z - enemy.position.y
            );
            if (strikeDistance <= enemy.attackRange + STRIKER_DASH_HIT_RADIUS) {
              const contactDamage = this.damageSystem.getEnemyContactDamage(enemy) * 1.08;
              const outcome = onPartyDamaged?.(contactDamage, enemy, threatTarget.id) ?? { damage: contactDamage };
              damageTaken += outcome.damage ?? 0;
            }
          }
          enemy.attackCooldownRemaining = enemy.attackCooldown * 0.9;
          enemy.specialCooldownRemaining = enemy.strikerDashCooldown;
          enemy.specialAction = "";
          enemy.setState(ENEMY_STATES.AGGRO);
          break;
        }

        if (enemy.role === "harrier" && distanceToTarget < enemy.harrierMinDistance * 0.82) {
          enemy.setState(ENEMY_STATES.AGGRO);
          break;
        }
        if (distanceToTarget > enemy.attackRange * 1.22 + enemy.collisionRadius) {
          enemy.setState(ENEMY_STATES.AGGRO);
          break;
        }

        if (!this.enemyAttacksEnabled) {
          break;
        }

        if (enemy.staggerRemaining <= 0 && enemy.attackCooldownRemaining <= 0) {
          if (enemy.attackWindupSeconds > 0 && enemy.stateTime < enemy.attackWindupSeconds) {
            break;
          }
          const strikeDistance = Math.max(
            0,
            Math.hypot(targetPosition.x - enemy.position.x, targetPosition.z - enemy.position.y) - enemy.collisionRadius
          );
          const strikeConnected = strikeDistance <= enemy.attackRange + 0.02;
          enemy.markAttackStrike();
          if (strikeConnected && threatTarget?.id) {
            const contactDamage = this.damageSystem.getEnemyContactDamage(enemy);
            const outcome = onPartyDamaged?.(contactDamage, enemy, threatTarget.id) ?? { damage: contactDamage };
            damageTaken += outcome.damage ?? 0;
          }
          enemy.attackCooldownRemaining = enemy.attackCooldown;
          enemy.stateTime = 0;
          if (enemy.role === "harrier" || enemy.role === "bulwark") {
            enemy.setState(ENEMY_STATES.AGGRO);
          }
        }
        break;
      }
      default:
        break;
    }

    return { aggro, damageTaken };
  }

  _selectEnemyForAttack(playerPosition, attackEvent) {
    const originX = Number(attackEvent?.sourcePosition?.x);
    const originZ = Number(attackEvent?.sourcePosition?.z ?? attackEvent?.sourcePosition?.y);
    const attackOrigin = {
      x: Number.isFinite(originX) ? originX : playerPosition.x,
      z: Number.isFinite(originZ) ? originZ : playerPosition.z,
    };

    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    const attackDirection = attackEvent.direction.clone().normalize();
    const minDot = typeof attackEvent.minDot === "number" ? attackEvent.minDot : 0.15;

    if (attackEvent.targetEnemyId) {
      const direct = this.enemies.find((enemy) => enemy.id === attackEvent.targetEnemyId && enemy.isAlive());
      if (direct) {
        const distance = Math.hypot(direct.position.x - attackOrigin.x, direct.position.y - attackOrigin.z);
        if (distance <= attackEvent.range) {
          return direct;
        }
      }
    }

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;

      const toEnemy = new THREE.Vector2(enemy.position.x - attackOrigin.x, enemy.position.y - attackOrigin.z);
      const distance = toEnemy.length();
      const effectiveDistance = Math.max(0, distance - enemy.collisionRadius);
      if (effectiveDistance > attackEvent.range || distance <= 1e-6) continue;

      toEnemy.multiplyScalar(1 / distance);
      const dot = toEnemy.dot(attackDirection);
      if (dot < minDot) continue;

      if (effectiveDistance < bestDistance) {
        best = enemy;
        bestDistance = effectiveDistance;
      }
    }

    return best;
  }

  _applyAttackEvent(playerPosition, attackEvent, onEnemyHit, onEnemyKilled = null) {
    const target = this._selectEnemyForAttack(playerPosition, attackEvent);
    if (!target) return 0;
    const resolvedAttackerId = String(attackEvent.attackerId ?? "arthur");
    const sourceX = Number(attackEvent?.sourcePosition?.x);
    const sourceZ = Number(attackEvent?.sourcePosition?.z ?? attackEvent?.sourcePosition?.y);
    const attackOrigin = {
      x: Number.isFinite(sourceX) ? sourceX : playerPosition.x,
      z: Number.isFinite(sourceZ) ? sourceZ : playerPosition.z,
    };

    let damageAmount = 0;
    let shouldStagger = false;
    let staggerDuration = ENEMY_STAGGER_SECONDS * target.staggerDurationScale;

    const outgoingMultiplier = Math.max(0, Number(attackEvent.damageMultiplier) || 1);
    if (attackEvent.type === "charge") {
      const charge = this.damageSystem.getChargeDamage(attackEvent.chargeRatio);
      damageAmount = charge.amount * outgoingMultiplier;
      shouldStagger = true;
      staggerDuration = ENEMY_STAGGER_SECONDS * target.staggerDurationScale * (0.9 + (attackEvent.chargeRatio ?? 0) * 0.85);
    } else {
      damageAmount = this.damageSystem.getLightDamage(attackEvent.comboStep) * outgoingMultiplier;
    }
    damageAmount = this._resolveDamageAmount({
      baseDamage: damageAmount,
      attackerId: resolvedAttackerId,
      targetId: target.id,
      attackType: attackEvent.type ?? "light",
      damageType: attackEvent.damageType ?? "physical",
      source: "player_attack",
      consumeStatusCharges: attackEvent.consumeStatusCharges !== false,
      attackEvent,
      target,
    });
    const frontBlocked = this._isBulwarkFrontBlocked(target, attackOrigin);
    target.lastHitBlocked = frontBlocked;
    if (frontBlocked) {
      damageAmount *= target.bulwarkShieldDamageScale ?? 0.5;
    }

    this._recordLastDamager(target, resolvedAttackerId);
    const dealt = this.damageSystem.applyDamageToEnemy(target, Math.max(0, damageAmount));

    if (dealt > 0) {
      const hitDirection = new THREE.Vector2(target.position.x - attackOrigin.x, target.position.y - attackOrigin.z);
      const hitKnockback = attackEvent.type === "charge" ? 1.8 + (attackEvent.chargeRatio ?? 0) * 1.55 : 0.85;
      target.applyHitFeedback({
        direction: hitDirection,
        knockback: hitKnockback,
      });

      if (target.state !== ENEMY_STATES.ATTACK && target.state !== ENEMY_STATES.AGGRO) {
        target.setState(ENEMY_STATES.AGGRO);
      }
      if (shouldStagger) {
        target.staggerRemaining = Math.max(target.staggerRemaining, staggerDuration);
      }
      const killEvent =
        target.health <= 0
          ? this._finalizeEnemyDeath(target, {
              source: "player_attack",
              attackType: attackEvent.type ?? "light",
              damageType: attackEvent.damageType ?? "physical",
              onEnemyKilled,
            })
          : null;
      const killed = Boolean(killEvent);
      onEnemyHit?.({
        attackerId: killEvent?.killerId || resolvedAttackerId,
        type: attackEvent.type,
        chargeRatio: attackEvent.chargeRatio ?? 0,
        direction: hitDirection,
        targetId: target.id,
        damage: dealt,
        killed,
        blocked: frontBlocked,
      });
    }

    return dealt;
  }

  applySupportDamageToEnemy(enemyId, amount, sourcePosition = null, options = {}) {
    const target = this.enemies.find((enemy) => enemy.id === enemyId && enemy.isAlive());
    if (!target) return 0;

    const resolvedDamage = this._resolveDamageAmount({
      baseDamage: Math.max(0, Number(amount) || 0),
      attackerId: options.attackerId ?? "support",
      targetId: target.id,
      attackType: options.attackType ?? "support",
      damageType: options.damageType ?? "magic",
      source: options.source ?? "support",
      consumeStatusCharges: options.consumeStatusCharges !== false,
      attackEvent: options.attackEvent ?? null,
      target,
    });
    if (resolvedDamage <= 0) return 0;

    const originX = Number(sourcePosition?.x);
    const originZ = Number(sourcePosition?.z ?? sourcePosition?.y);
    const attackOrigin = {
      x: Number.isFinite(originX) ? originX : target.position.x,
      z: Number.isFinite(originZ) ? originZ : target.position.y,
    };
    const frontBlocked = this._isBulwarkFrontBlocked(target, attackOrigin);
    target.lastHitBlocked = frontBlocked;
    const finalDamage = frontBlocked ? resolvedDamage * (target.bulwarkShieldDamageScale ?? 0.5) : resolvedDamage;

    this._recordLastDamager(target, options.attackerId ?? "support");
    const dealt = this.damageSystem.applyDamageToEnemy(target, finalDamage);
    if (dealt <= 0) return 0;

    const hitDirection = new THREE.Vector2(
      target.position.x - attackOrigin.x,
      target.position.y - attackOrigin.z
    );
    target.applyHitFeedback({
      direction: hitDirection,
      knockback: Math.max(0.35, Number(options.knockback) || 0.45),
    });
    if (target.state !== ENEMY_STATES.AGGRO && target.state !== ENEMY_STATES.ATTACK) {
      target.setState(ENEMY_STATES.AGGRO);
    }

    if (options.staggerSeconds > 0) {
      target.staggerRemaining = Math.max(target.staggerRemaining, Number(options.staggerSeconds));
    }

    if (target.health <= 0) {
      this._finalizeEnemyDeath(target, {
        source: options.source ?? "support",
        attackType: options.attackType ?? "support",
        damageType: options.damageType ?? "magic",
        onEnemyKilled: options.onEnemyKilled,
      });
    }
    return dealt;
  }

  getClosestAliveEnemy(position, maxRange = Number.POSITIVE_INFINITY) {
    if (!position) return null;
    const maxDistance = Math.max(0, Number(maxRange));
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const distance = Math.hypot(enemy.position.x - position.x, enemy.position.y - position.y);
      if (distance > maxDistance || distance >= bestDistance) continue;
      best = enemy;
      bestDistance = distance;
    }
    if (!best) return null;
    return {
      id: best.id,
      x: best.position.x,
      z: best.position.y,
      distance: bestDistance,
    };
  }

  update(
    dtSeconds,
    {
      playerPosition,
      threatTargets = null,
      attackEvents = [],
      onPlayerDamaged,
      onPartyDamaged,
      onStatusApplied,
      onEnemyHit,
      onEnemyKilled,
    }
  ) {
    this.elapsedSeconds += dtSeconds;
    const normalizedThreatTargets = this._normalizeThreatTargets(playerPosition, threatTargets);
    const damageTargetCallback =
      typeof onPartyDamaged === "function"
        ? onPartyDamaged
        : (amount, sourceEnemy, targetId) => onPlayerDamaged?.(amount, sourceEnemy, targetId);

    let damageDealtThisFrame = 0;
    const killCallback = typeof onEnemyKilled === "function" ? onEnemyKilled : this.onEnemyKilled;
    for (const attackEvent of attackEvents) {
      damageDealtThisFrame += this._applyAttackEvent(playerPosition, attackEvent, onEnemyHit, killCallback);
    }

    let anyAggro = false;
    let damageTakenThisFrame = 0;

    for (const enemy of this.enemies) {
      enemy.lastHitBlocked = false;
      const aiOutcome = this._runEnemyAi(
        dtSeconds,
        enemy,
        normalizedThreatTargets,
        damageTargetCallback,
        onStatusApplied
      );
      if (aiOutcome.aggro) {
        anyAggro = true;
      }
      damageTakenThisFrame += aiOutcome.damageTaken;
      enemy.updateVisuals(dtSeconds, this.elapsedSeconds);
    }
    damageTakenThisFrame += this._updateEnemyProjectiles(
      dtSeconds,
      normalizedThreatTargets,
      damageTargetCallback
    );

    if (anyAggro) {
      this.combatLingerRemaining = COMBAT_LINGER_SECONDS;
    } else {
      this.combatLingerRemaining = Math.max(0, this.combatLingerRemaining - dtSeconds);
    }

    this.combatActive = anyAggro || this.combatLingerRemaining > 0;

    this._updateLootOrbs(dtSeconds, playerPosition);

    return {
      combatActive: this.combatActive,
      anyAggro,
      combatLingerRemaining: this.combatLingerRemaining,
      damageDealt: damageDealtThisFrame,
      damageTaken: damageTakenThisFrame,
      lootCount: this.lootCollected,
      enemiesAlive: this.enemies.filter((enemy) => enemy.isAlive()).length,
      enemiesTotal: this.enemies.length,
      enemiesDefeated: this.totalEnemiesDefeated,
      activeOrbs: this.lootOrbs.length,
      activeProjectiles: this.enemyProjectiles.length,
    };
  }

  pickEnemyAtWorldPoint(worldPoint, radius = 0.8) {
    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      const distance = Math.hypot(enemy.position.x - worldPoint.x, enemy.position.y - worldPoint.y);
      if (distance <= radius + enemy.collisionRadius * 0.8 && distance < bestDistance) {
        best = enemy;
        bestDistance = distance;
      }
    }

    return best;
  }

  getEnemySnapshots() {
    return this.enemies.map((enemy) => enemy.toSnapshot());
  }

  getEnemyTargetPoint(enemyId) {
    const enemy = this.enemies.find((entry) => entry.id === enemyId && entry.isAlive());
    if (!enemy) return null;
    return enemy.position.clone();
  }

  getEnemyState(enemyId) {
    const enemy = this.enemies.find((entry) => entry.id === enemyId);
    if (!enemy) return null;
    return {
      id: enemy.id,
      type: enemy.role,
      state: enemy.state,
      targetId: enemy.currentTargetId || "",
      x: Number(enemy.position.x.toFixed(3)),
      z: Number(enemy.position.y.toFixed(3)),
      isShielding: Boolean(enemy.isShielding),
      telegraphActive: Boolean(enemy.specialTelegraphRemaining > 0 || enemy.projectileTelegraph?.visible),
      debuffCooldown: Number(Math.max(0, enemy.specialCooldownRemaining).toFixed(3)),
      lastHitBlocked: Boolean(enemy.lastHitBlocked),
    };
  }

  forceHexerCast(enemyId, { targetId = "", targetPosition = null, onStatusApplied = null } = {}) {
    const enemy = this.enemies.find((entry) => entry.id === enemyId && entry.isAlive() && entry.role === "hexer");
    if (!enemy) return { cast: false };
    const resolvedTarget =
      (targetId && { id: String(targetId), x: Number(targetPosition?.x), z: Number(targetPosition?.z) }) ||
      (targetPosition ? { id: "", x: Number(targetPosition.x), z: Number(targetPosition.z) } : null);
    if (!resolvedTarget || !Number.isFinite(resolvedTarget.x) || !Number.isFinite(resolvedTarget.z)) {
      return { cast: false };
    }
    enemy.specialAction = "hexer_hex";
    enemy.specialTargetId = resolvedTarget.id || "";
    enemy.specialTargetPosition = new THREE.Vector2(resolvedTarget.x, resolvedTarget.z);
    enemy.specialTelegraphDuration = 0.5;
    enemy.specialTelegraphRemaining = 0;
    enemy.specialCooldownRemaining = enemy.hexerDebuffCooldown;
    onStatusApplied?.({
      sourceEnemyId: enemy.id,
      targetId: resolvedTarget.id || "",
      effectId: STATUS_EFFECT_IDS.HEX_WEAKENED,
      durationSeconds: HEXER_DEBUFF_SECONDS,
    });
    enemy.markAttackStrike();
    enemy.setState(ENEMY_STATES.AGGRO);
    return {
      cast: true,
      enemyId: enemy.id,
      targetId: resolvedTarget.id || "",
    };
  }

  setEnemyHealth(enemyId, value) {
    const enemy = this.enemies.find((entry) => entry.id === enemyId);
    if (!enemy) return null;
    const max = Math.max(1, Number(enemy.maxHealth) || 1);
    const next = Math.max(0, Math.min(max, Number(value) || 0));
    enemy.health = next;
    if (enemy.health <= 0) {
      this._finalizeEnemyDeath(enemy, {
        source: "debug_set_health",
        attackType: "set_health",
        damageType: "debug",
      });
    }
    if (enemy.health > 0 && enemy.state === ENEMY_STATES.DEAD) {
      enemy.deadFade = 1;
      enemy.deadRemoved = false;
      enemy.lastDamagerId = "";
      enemy.setState(ENEMY_STATES.IDLE);
      if (enemy.group && !enemy.group.parent) {
        this.root.add(enemy.group);
      }
    }
    return {
      id: enemy.id,
      health: Number(enemy.health.toFixed(2)),
      maxHealth: enemy.maxHealth,
      state: enemy.state,
    };
  }

  getOrbSnapshots() {
    return this.lootOrbs.map((orb) => ({
      x: Number(orb.x.toFixed(3)),
      z: Number(orb.z.toFixed(3)),
    }));
  }

  getEnemyProjectileSnapshots() {
    return this.enemyProjectiles.map((projectile) => ({
      x: Number(projectile.x.toFixed(3)),
      z: Number(projectile.z.toFixed(3)),
      lifeRemaining: Number(projectile.lifeRemaining.toFixed(3)),
      sourceEnemyId: projectile.sourceEnemyId,
      targetEntityId: projectile.targetEntityId,
    }));
  }

  getCombatState() {
    return {
      combatActive: this.combatActive,
      combatLingerRemaining: Number(this.combatLingerRemaining.toFixed(3)),
      lootCount: this.lootCollected,
      activeProjectiles: this.enemyProjectiles.length,
    };
  }

  forceDefeatAllEnemies() {
    for (const enemy of this.enemies) {
      if (!enemy.isAlive()) continue;
      enemy.health = 0;
      this._finalizeEnemyDeath(enemy, {
        source: "debug_force_defeat",
        attackType: "defeat_all",
        damageType: "debug",
      });
    }
  }

  setEnemyAttacksEnabled(enabled) {
    this.enemyAttacksEnabled = Boolean(enabled);
  }

  isEnemyAttacksEnabled() {
    return this.enemyAttacksEnabled;
  }

  resetProgress() {
    this.lootCollected = 0;
    this.totalEnemiesDefeated = 0;
    this.combatLingerRemaining = 0;
    this.combatActive = false;
  }

  dispose() {
    this.clearScene();
    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}

export function computeAttackDirection(playerPosition, targetPoint, fallbackDirection) {
  if (!targetPoint) {
    return fallbackDirection.clone().normalize();
  }
  const direction = new THREE.Vector2(targetPoint.x - playerPosition.x, targetPoint.y - playerPosition.z);
  if (direction.lengthSq() <= 1e-6) {
    return fallbackDirection.clone().normalize();
  }
  return direction.normalize();
}
