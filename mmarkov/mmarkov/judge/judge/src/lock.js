let locked = false;

export function isLocked() {
  console.log("[lock] setLocked →", locked);     // ← TEMP
  return locked;
}

export function setLocked(l) {
  locked = !!l;
  console.log("[lock] setLocked →", locked);     // ← TEMP

  // CSS state on marginal SVGs
  d3.select("#top-marginal").classed("locked", locked);
  d3.select("#right-marginal").classed("locked", locked);

  const show = !locked;
  d3.select("#probability-label").style("display", show ? null : "none");
}


