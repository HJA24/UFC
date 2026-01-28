// Formatting
const fmtAdd2 = d3.format(".2~f"); // ≤2 decimals, trims trailing zeros
export const fmtInt  = d3.format("d");
export const fmtProb = d3.format("~f");

const fmtBase = v =>
  Math.abs(v - 0)   < 1e-6 ? "0"   :
  Math.abs(v - 0.5) < 1e-6 ? "0.5" :
  Math.abs(v - 1)   < 1e-6 ? "1"   : null;

export const tickFmt2DecOrBase = (baseTicks = [0, 0.5, 1]) => v => fmtBase(v) ?? fmtAdd2(v);

// Geometry helpers
export function pointOnPathByCoord(pathNode, target, orient = "x", eps = 0.5, maxIter = 20) {
  if (!pathNode) return null;
  const len = pathNode.getTotalLength();
  let lo = 0, hi = len, it = 0;
  let best = pathNode.getPointAtLength(0), bestErr = Infinity;
  while (it++ < maxIter) {
    const mid = (lo + hi) / 2;
    const p = pathNode.getPointAtLength(mid);
    const v = (orient === "x" ? p.x : p.y);
    const err = Math.abs(v - target);
    if (err < bestErr) { best = p; bestErr = err; }
    if (err <= eps) break;
    if (v < target) lo = mid; else hi = mid;
  }
  return best;
}

export const applyMatrix = (p, m) => ({
  x: m.a * p.x + m.c * p.y + m.e,
  y: m.b * p.x + m.d * p.y + m.f
});

// Tick logic (pixel-aware)
export function buildTicksPixelAware(baseTicks, hoveredValue, scale, pxTol) {
  const hvPx = scale(hoveredValue);
  const kept = baseTicks.filter(t => Math.abs(scale(t) - hvPx) >= pxTol);
  kept.push(hoveredValue);
  kept.sort((a, b) => a - b);
  return kept;
}
