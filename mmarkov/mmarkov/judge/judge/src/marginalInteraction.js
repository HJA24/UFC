import { tickFmt2DecOrBase, buildTicksPixelAware, pointOnPathByCoord, applyMatrix } from "./utils.js";
import { CONFIG } from "./config.js";

/**
 * Adds dynamic extra tick (≤2 decimals), pixel-overlap aware, and a moving circle
 * that follows the KDE; hides both when KDE ~ 0 (near baseline by zeroTolPx).
 */
export function attachDynamicTickAndMarker({
  svg,
  axisGroup,
  scale,
  axisFactory,                 // (ticks) => d3.axisTop/Right(scale).tickValues(ticks)
  overlay,                     // {x,y,width,height} in marginal SVG coords
  baseTicks = CONFIG.baseTicks,
  pxTol = CONFIG.tickOverlapPx,
  zeroTolPx = CONFIG.zeroTolPx,
  orientation = "horizontal",  // "horizontal" (top) or "vertical" (right)
  pathSelector = "path.kde, .kde path",
  markerRadius = 3
}) {
  const tickFmt = tickFmt2DecOrBase(baseTicks);
  const renderAxis = ticks => axisGroup.call(axisFactory(ticks).tickFormat(tickFmt).tickSize(0));

  renderAxis(baseTicks);

  const marker = svg.append("circle")
    .attr("r", markerRadius)
    .attr("fill", "currentColor")
    .attr("stroke", "white")
    .attr("stroke-width", 1.5)
    .attr("pointer-events", "none")
    .style("display", "none");

  const inOverlay = (px, py) =>
    px >= overlay.x && px <= overlay.x + overlay.width &&
    py >= overlay.y && py <= overlay.y + overlay.height;

  function onMove(event) {
    const [gpx, gpy] = d3.pointer(event, svg.node());
    if (!inOverlay(gpx, gpy)) { onLeave(); return; }

    const value = (orientation === "horizontal")
      ? scale.invert(gpx - overlay.x)
      : scale.invert(gpy - overlay.y);

    const pathNode = svg.select(pathSelector).node();
    if (!pathNode) { marker.style("display", "none"); renderAxis(baseTicks); return; }

    const [lx, ly] = d3.pointer(event, pathNode);
    const pLocal = pointOnPathByCoord(
      pathNode,
      (orientation === "horizontal" ? lx : ly),
      (orientation === "horizontal" ? "x" : "y")
    );
    if (!pLocal) { marker.style("display", "none"); renderAxis(baseTicks); return; }

    const pSvg = applyMatrix(pLocal, pathNode.getCTM());

    // Near baseline? (hide marker + extra tick)
    let nearZero;
    if (orientation === "horizontal") {
      const dyTop = Math.abs(pSvg.y - overlay.y);
      const dyBottom = Math.abs(pSvg.y - (overlay.y + overlay.height));
      nearZero = Math.min(dyTop, dyBottom) <= zeroTolPx;
    } else {
      const dxLeft = Math.abs(pSvg.x - overlay.x);
      const dxRight = Math.abs(pSvg.x - (overlay.x + overlay.width));
      nearZero = Math.min(dxLeft, dxRight) <= zeroTolPx;
    }
    if (nearZero) { marker.style("display", "none"); renderAxis(baseTicks); return; }

    // Show marker and update ticks
    renderAxis(buildTicksPixelAware(baseTicks, value, scale, pxTol));
    marker.raise().style("display", null).attr("cx", pSvg.x).attr("cy", pSvg.y);
  }

  function onLeave() {
    renderAxis(baseTicks);
    marker.style("display", "none");
  }

  svg.on("pointermove.kdeTick", onMove)
     .on("pointerleave.kdeTick", onLeave);
}
