import * as THREE from "https://unpkg.com/three@0.160.0/build/three.module.js";

export const ENEMY_STAGGER_SECONDS = 0.6;

const LIGHT_BASE_DAMAGE = 10;
const LIGHT_COMBO_BONUS = 4;
const CHARGE_BASE_DAMAGE = 14;
const CHARGE_BONUS_MAX = 22;
const PLAYER_CONTACT_DAMAGE = 10;

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

// DamageSystem keeps combat numbers centralized and deterministic.
export class DamageSystem {
  getLightDamage(comboStep) {
    const combo = comboStep >= 2 ? 2 : 1;
    return LIGHT_BASE_DAMAGE + (combo - 1) * LIGHT_COMBO_BONUS;
  }

  getChargeDamage(chargeRatio) {
    const ratio = clamp01(chargeRatio);
    return {
      amount: CHARGE_BASE_DAMAGE + CHARGE_BONUS_MAX * ratio,
      fullCharge: ratio >= 0.999,
    };
  }

  getEnemyContactDamage(enemyOrType) {
    return PLAYER_CONTACT_DAMAGE;
  }

  applyDamageToEnemy(enemy, amount) {
    const nextHealth = Math.max(0, enemy.health - amount);
    const dealt = enemy.health - nextHealth;
    enemy.health = nextHealth;
    return dealt;
  }

  applyDamageToPlayer(playerState, amount) {
    const nextHealth = Math.max(0, playerState.health - amount);
    const dealt = playerState.health - nextHealth;
    playerState.health = nextHealth;
    return dealt;
  }

  buildHitDirection(fromPosition, toPosition) {
    const direction = new THREE.Vector2(toPosition.x - fromPosition.x, toPosition.y - fromPosition.y);
    if (direction.lengthSq() <= 1e-6) {
      return new THREE.Vector2(0, 1);
    }
    return direction.normalize();
  }
}
