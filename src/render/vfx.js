import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

const LIGHT_SLASH_LIFETIME = 0.12;
const CHARGE_SLASH_LIFETIME = 0.2;
const CHARGE_TRAIL_LIFETIME = 0.14;
const TARGET_RING_LIFETIME = 0.3;
const CHARGE_SPARK_LIFETIME = 0.24;
const CHARGE_SPARK_INTERVAL = 0.06;
const CHARGE_SHOW_THRESHOLD = 0.02;
const DUST_BURST_LIFETIME = 0.2;

const SPARK_DIRECTIONS = [
  new THREE.Vector2(1, 0),
  new THREE.Vector2(0.6, 0.8),
  new THREE.Vector2(-0.35, 0.9),
  new THREE.Vector2(-0.95, 0.25),
  new THREE.Vector2(-0.75, -0.65),
  new THREE.Vector2(0.25, -0.95),
  new THREE.Vector2(0.95, -0.2),
];

function disposeMesh(mesh) {
  mesh.geometry?.dispose?.();
  const material = mesh.material;
  if (Array.isArray(material)) {
    for (const entry of material) {
      entry?.dispose?.();
    }
  } else {
    material?.dispose?.();
  }
}

function normalizeDirection(direction) {
  const dir = direction ? direction.clone() : new THREE.Vector2(0, 1);
  if (dir.lengthSq() <= 1e-6) {
    dir.set(0, 1);
  } else {
    dir.normalize();
  }
  return dir;
}

// VfxSystem owns lightweight combat readability effects and their cleanup.
export class VfxSystem {
  constructor({ threeScene }) {
    this.threeScene = threeScene;
    this.root = new THREE.Group();
    this.root.name = "vfx-root";
    this.threeScene.add(this.root);

    this.slashes = [];
    this.targetRings = [];
    this.sparks = [];
    this.dustBursts = [];
    this.sparkCounter = 0;
    this.sparkAccumulator = 0;
    this.chargeArcProgress = -1;

    this.chargeGroup = new THREE.Group();
    this.chargeGroup.visible = false;
    this.chargeBase = new THREE.Mesh(
      new THREE.RingGeometry(0.42, 0.5, 40),
      new THREE.MeshBasicMaterial({
        color: "#96a79a",
        transparent: true,
        opacity: 0.25,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.chargeBase.rotation.x = -Math.PI / 2;
    this.chargeBase.position.y = -0.83;
    this.chargeGroup.add(this.chargeBase);

    this.chargeArc = new THREE.Mesh(
      this._createChargeArcGeometry(0.02),
      new THREE.MeshBasicMaterial({
        color: "#f5f5dd",
        transparent: true,
        opacity: 0.86,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    this.chargeArc.rotation.x = -Math.PI / 2;
    this.chargeArc.position.y = -0.82;
    this.chargeGroup.add(this.chargeArc);
    this.root.add(this.chargeGroup);
  }

  _createChargeArcGeometry(progress) {
    const clamped = Math.max(0.01, Math.min(1, progress));
    return new THREE.RingGeometry(0.37, 0.45, 40, 1, -Math.PI / 2, Math.PI * 2 * clamped);
  }

  _setChargeArcProgress(progress) {
    const clamped = Math.max(0, Math.min(1, progress));
    if (Math.abs(clamped - this.chargeArcProgress) < 0.01) return;
    this.chargeArcProgress = clamped;
    this.chargeArc.geometry.dispose();
    this.chargeArc.geometry = this._createChargeArcGeometry(Math.max(0.02, clamped));
  }

  _spawnSlashMesh({
    playerPosition,
    dir,
    innerRadius,
    outerRadius,
    thetaStart,
    thetaLength,
    color,
    opacity,
    sizeScale,
    life,
    y = -0.54,
    offset = 0.7,
  }) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(innerRadius, outerRadius, 28, 1, thetaStart, thetaLength),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.rotation.y = Math.atan2(dir.x, dir.y);
    mesh.position.set(playerPosition.x + dir.x * offset, y, playerPosition.z + dir.y * offset);
    mesh.scale.set(sizeScale, sizeScale, sizeScale);
    this.root.add(mesh);

    this.slashes.push({
      mesh,
      maxLife: life,
      life,
      baseScale: sizeScale,
    });
  }

  _spawnDustBurst(playerPosition) {
    for (let i = 0; i < 4; i += 1) {
      const angle = (Math.PI * 2 * i) / 4;
      const mesh = new THREE.Mesh(
        new THREE.RingGeometry(0.08, 0.14, 16),
        new THREE.MeshBasicMaterial({
          color: "#c9d6b9",
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide,
          depthWrite: false,
        })
      );
      mesh.rotation.x = -Math.PI / 2;
      mesh.position.set(
        playerPosition.x + Math.cos(angle) * 0.19,
        -0.84,
        playerPosition.z + Math.sin(angle) * 0.14
      );
      this.root.add(mesh);
      this.dustBursts.push({
        mesh,
        life: DUST_BURST_LIFETIME,
        maxLife: DUST_BURST_LIFETIME,
        driftX: Math.cos(angle) * 0.2,
        driftZ: Math.sin(angle) * 0.16,
      });
    }
  }

  spawnSlash({ playerPosition, direction, chargeRatio = 0, attackType = "light" }) {
    const dir = normalizeDirection(direction);
    const clampedCharge = Math.max(0, Math.min(1, chargeRatio));

    if (attackType === "charge") {
      const heavyScale = 1.02 + clampedCharge * 0.52;
      this._spawnSlashMesh({
        playerPosition,
        dir,
        innerRadius: 0.3,
        outerRadius: 0.57,
        thetaStart: -1.15,
        thetaLength: 2.45,
        color: "#f7f7eb",
        opacity: 0.92,
        sizeScale: heavyScale,
        life: CHARGE_SLASH_LIFETIME,
      });
      // Faint trailing afterimage for charge release.
      this._spawnSlashMesh({
        playerPosition,
        dir,
        innerRadius: 0.26,
        outerRadius: 0.54,
        thetaStart: -1.0,
        thetaLength: 2.1,
        color: "#d5ebe7",
        opacity: 0.42,
        sizeScale: heavyScale * 1.08,
        life: CHARGE_TRAIL_LIFETIME,
        y: -0.545,
        offset: 0.74,
      });
      this._spawnDustBurst(playerPosition);
      return;
    }

    const lightScale = 0.82 + clampedCharge * 0.28;
    this._spawnSlashMesh({
      playerPosition,
      dir,
      innerRadius: 0.39,
      outerRadius: 0.47,
      thetaStart: -0.84,
      thetaLength: 1.62,
      color: "#ffffff",
      opacity: 0.8,
      sizeScale: lightScale,
      life: LIGHT_SLASH_LIFETIME,
    });
  }

  spawnTapTargetRing(position, color = "#f5f3a1") {
    this.spawnGroundRing({
      position,
      color,
      innerRadius: 0.38,
      outerRadius: 0.45,
      life: TARGET_RING_LIFETIME,
      opacity: 0.92,
      spread: 0.35,
      y: -0.84,
    });
  }

  spawnGroundRing({
    position,
    color = "#f5f3a1",
    innerRadius = 0.38,
    outerRadius = 0.45,
    life = TARGET_RING_LIFETIME,
    opacity = 0.92,
    spread = 0.35,
    y = -0.84,
  }) {
    const mesh = new THREE.Mesh(
      new THREE.RingGeometry(innerRadius, outerRadius, 30),
      new THREE.MeshBasicMaterial({
        color,
        transparent: true,
        opacity,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(position.x, y, position.y);
    this.root.add(mesh);
    this.targetRings.push({
      mesh,
      life,
      maxLife: life,
      spread,
    });
  }

  _spawnSpark(playerPosition) {
    const direction = SPARK_DIRECTIONS[this.sparkCounter % SPARK_DIRECTIONS.length];
    this.sparkCounter += 1;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.08, 0.08),
      new THREE.MeshBasicMaterial({
        color: "#f5f3bf",
        transparent: true,
        opacity: 0.92,
        side: THREE.DoubleSide,
        depthWrite: false,
      })
    );
    mesh.position.set(playerPosition.x, -0.57, playerPosition.z);
    mesh.rotation.x = -Math.PI / 2;
    this.root.add(mesh);

    this.sparks.push({
      mesh,
      life: CHARGE_SPARK_LIFETIME,
      maxLife: CHARGE_SPARK_LIFETIME,
      velocity: direction.clone().multiplyScalar(1.45),
    });
  }

  updateChargeFeedback({ playerPosition, chargeRatio, charging, dtSeconds = 1 / 60 }) {
    const charge = Math.max(0, Math.min(1, chargeRatio));
    const showCharge = charging || charge > CHARGE_SHOW_THRESHOLD;
    this.chargeGroup.visible = showCharge;
    if (!showCharge) {
      this.sparkAccumulator = 0;
      this._setChargeArcProgress(0);
      return;
    }

    this.chargeGroup.position.set(playerPosition.x, 0, playerPosition.z);
    this._setChargeArcProgress(charge);

    if (charging && charge >= 0.9) {
      this.sparkAccumulator += dtSeconds;
      while (this.sparkAccumulator >= CHARGE_SPARK_INTERVAL) {
        this._spawnSpark(playerPosition);
        this.sparkAccumulator -= CHARGE_SPARK_INTERVAL;
      }
    } else {
      this.sparkAccumulator = 0;
    }
  }

  update(dtSeconds) {
    for (let i = this.slashes.length - 1; i >= 0; i -= 1) {
      const slash = this.slashes[i];
      slash.life = Math.max(0, slash.life - dtSeconds);
      const t = slash.life / slash.maxLife;
      slash.mesh.material.opacity = 0.9 * t;
      const scale = slash.baseScale + (1 - t) * 0.2;
      slash.mesh.scale.set(scale, scale, scale);
      if (slash.life <= 0) {
        this.root.remove(slash.mesh);
        disposeMesh(slash.mesh);
        this.slashes.splice(i, 1);
      }
    }

    for (let i = this.targetRings.length - 1; i >= 0; i -= 1) {
      const ring = this.targetRings[i];
      ring.life = Math.max(0, ring.life - dtSeconds);
      const t = ring.life / ring.maxLife;
      ring.mesh.material.opacity = 0.9 * t;
      const spread = typeof ring.spread === "number" ? ring.spread : 0.35;
      const scale = 1 + (1 - t) * spread;
      ring.mesh.scale.set(scale, scale, scale);
      if (ring.life <= 0) {
        this.root.remove(ring.mesh);
        disposeMesh(ring.mesh);
        this.targetRings.splice(i, 1);
      }
    }

    for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
      const spark = this.sparks[i];
      spark.life = Math.max(0, spark.life - dtSeconds);
      const t = spark.life / spark.maxLife;
      spark.mesh.material.opacity = 0.95 * t;
      spark.mesh.position.x += spark.velocity.x * dtSeconds;
      spark.mesh.position.z += spark.velocity.y * dtSeconds;
      spark.mesh.position.y += 0.55 * dtSeconds;
      if (spark.life <= 0) {
        this.root.remove(spark.mesh);
        disposeMesh(spark.mesh);
        this.sparks.splice(i, 1);
      }
    }

    for (let i = this.dustBursts.length - 1; i >= 0; i -= 1) {
      const burst = this.dustBursts[i];
      burst.life = Math.max(0, burst.life - dtSeconds);
      const t = burst.life / burst.maxLife;
      burst.mesh.material.opacity = 0.58 * t;
      burst.mesh.position.x += burst.driftX * dtSeconds;
      burst.mesh.position.z += burst.driftZ * dtSeconds;
      const scale = 1 + (1 - t) * 0.9;
      burst.mesh.scale.set(scale, scale, scale);
      if (burst.life <= 0) {
        this.root.remove(burst.mesh);
        disposeMesh(burst.mesh);
        this.dustBursts.splice(i, 1);
      }
    }
  }

  getDebugState() {
    return {
      slashes: this.slashes.length,
      targetRings: this.targetRings.length,
      sparks: this.sparks.length,
      dustBursts: this.dustBursts.length,
      chargeVisible: this.chargeGroup.visible,
    };
  }

  dispose() {
    for (const slash of this.slashes) {
      this.root.remove(slash.mesh);
      disposeMesh(slash.mesh);
    }
    this.slashes.length = 0;

    for (const ring of this.targetRings) {
      this.root.remove(ring.mesh);
      disposeMesh(ring.mesh);
    }
    this.targetRings.length = 0;

    for (const spark of this.sparks) {
      this.root.remove(spark.mesh);
      disposeMesh(spark.mesh);
    }
    this.sparks.length = 0;

    for (const burst of this.dustBursts) {
      this.root.remove(burst.mesh);
      disposeMesh(burst.mesh);
    }
    this.dustBursts.length = 0;

    this.chargeArc.geometry.dispose();
    this.chargeArc.material.dispose();
    this.chargeBase.geometry.dispose();
    this.chargeBase.material.dispose();
    this.chargeGroup.remove(this.chargeArc);
    this.chargeGroup.remove(this.chargeBase);
    this.root.remove(this.chargeGroup);

    if (this.root.parent) {
      this.root.parent.remove(this.root);
    }
  }
}
