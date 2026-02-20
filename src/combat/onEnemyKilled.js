export function onEnemyKilled(killerId = "", enemyId = "", context = {}) {
  return {
    killerId: String(killerId ?? ""),
    enemyId: String(enemyId ?? ""),
    source: String(context.source ?? ""),
    attackType: String(context.attackType ?? ""),
    damageType: String(context.damageType ?? ""),
    enemyRole: String(context.enemyRole ?? ""),
    enemyType: String(context.enemyType ?? ""),
    sceneId: String(context.sceneId ?? ""),
    elapsedSeconds: Math.max(0, Number(context.elapsedSeconds) || 0),
  };
}
