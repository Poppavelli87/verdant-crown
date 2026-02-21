function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function resolveWeights(agentA, agentB) {
  const wA = Math.max(0, Number(agentA.weight));
  const wB = Math.max(0, Number(agentB.weight));
  const sum = wA + wB;
  if (sum <= 1e-6) {
    return { a: 0, b: 0 };
  }
  return {
    a: wA / sum,
    b: wB / sum,
  };
}

export function resolveCircleSeparation(agents = [], { iterations = 2, personalSpaceMultiplier = 1 } = {}) {
  const resolvedIterations = Math.max(1, Math.floor(Number(iterations) || 1));
  const personalScale = Math.max(0.5, Number(personalSpaceMultiplier) || 1);
  const solved = agents.map((agent) => ({
    id: String(agent?.id ?? ""),
    x: Number(agent?.x) || 0,
    z: Number(agent?.z) || 0,
    radius: Math.max(0.05, Number(agent?.radius) || 0.3),
    weight: Math.max(0, Number(agent?.weight) || 0),
    kind: String(agent?.kind ?? "dynamic"),
  }));

  for (let iteration = 0; iteration < resolvedIterations; iteration += 1) {
    for (let i = 0; i < solved.length; i += 1) {
      const left = solved[i];
      for (let j = i + 1; j < solved.length; j += 1) {
        const right = solved[j];
        const minDistance = (left.radius + right.radius) * personalScale;
        const dx = right.x - left.x;
        const dz = right.z - left.z;
        const distance = Math.hypot(dx, dz);
        if (distance >= minDistance) continue;

        const overlap = minDistance - distance;
        const { a, b } = resolveWeights(left, right);
        if (a <= 1e-6 && b <= 1e-6) continue;

        let normalX = 1;
        let normalZ = 0;
        if (distance > 1e-6) {
          normalX = dx / distance;
          normalZ = dz / distance;
        } else {
          const parity = (i + j + iteration) % 2 === 0 ? 1 : -1;
          normalX = parity;
          normalZ = 0;
        }

        left.x -= normalX * overlap * a;
        left.z -= normalZ * overlap * a;
        right.x += normalX * overlap * b;
        right.z += normalZ * overlap * b;
      }
    }
  }

  return solved.map((agent) => ({
    id: agent.id,
    x: Number(clamp(agent.x, -9999, 9999).toFixed(6)),
    z: Number(clamp(agent.z, -9999, 9999).toFixed(6)),
  }));
}
