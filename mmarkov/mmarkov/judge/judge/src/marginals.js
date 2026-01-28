// marginals.js (optimized)
import { gaussianKernel, kernelDensityEstimator } from './kde.js';
import { redScale, blueScale } from './colours.js';

// ---- module-level constants (built once) ----
const P_DOMAIN = d3.range(0, 1.01, 0.01);
const STOPS    = d3.range(0, 1.01, 0.05);
const KERNEL   = gaussianKernel(0.05);
const KDE      = kernelDensityEstimator(KERNEL, P_DOMAIN);

// cache for aggregated samples: key = `${isRed ? 'R' : 'B'}:${Y}`
const AGG_CACHE = new Map();

// ensure a gradient exists once per SVG
function ensureGradient(svg, id, direction, stops, colorScale) {
  let defs = svg.select('defs');
  if (defs.empty()) defs = svg.append('defs');

  let g = defs.select(`#${id}`);
  if (g.empty()) {
    g = defs.append('linearGradient')
      .attr('id', id)
      .attr('x1', '0%').attr('y1', '0%')
      .attr('x2', direction === 'horizontal' ? '100%' : '0%')
      .attr('y2', direction === 'horizontal' ? '0%'   : '100%');

    g.selectAll('stop')
      .data(stops)
      .join('stop')
      .attr('offset', d => `${d * 100}%`)
      .attr('stop-color', d => colorScale(d));
  }
  return id;
}

export function plotMarginal({ blueY, redY, pSamples, blueMarginal, redMarginal, margin, width, height }) {
  if (!pSamples || !pSamples.length) {
    blueMarginal.selectAll('.kde').remove();
    redMarginal.selectAll('.kde').remove();
    return;
  }

  const kde = KDE(pSamples);
  const yMax = d3.max(kde, d => d.y) || 0;

  // --- helpers ---
  function plotTopMarginal() {
    const x = d3.scaleLinear().domain([0, 1]).range([margin.left, margin.left + width]);
    const y = d3.scaleLinear().domain([0, yMax]).range([margin.top, 0]);
    const gradId = ensureGradient(blueMarginal, 'blue-marginal-gradient', 'horizontal', STOPS, blueScale);

    const area = d3.area()
      .x(d => x(d.x))
      .y0(margin.top)
      .y1(d => y(d.y))
      .curve(d3.curveBasis);

    blueMarginal.selectAll('path.kde')
      .data([kde])
      .join('path')
      .attr('class', 'kde')
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', 'none')
      .attr('d', area);

    blueMarginal.selectAll('.secondary-x-axis').raise();
  }

  function plotRightMarginal() {
    const redW = +redMarginal.attr('width') || margin.right;
    const x = d3.scaleLinear().domain([0, yMax]).range([0, redW]);
    const y = d3.scaleLinear().domain([0, 1]).range([0, height]);
    const gradId = ensureGradient(redMarginal, 'red-marginal-gradient', 'vertical', STOPS, redScale);

    const area = d3.area()
      .x0(0)
      .x1(d => x(d.y)) // density -> horizontal extent
      .y(d => y(d.x))  // probability (0..1) -> vertical position
      .curve(d3.curveBasis);

    redMarginal.selectAll('path.kde')
      .data([kde])
      .join('path')
      .attr('class', 'kde')
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', 'none')
      .attr('d', area);

    redMarginal.selectAll('.secondary-y-axis').raise();
  }
  // --- /helpers ---

  if (blueY === redY) {
    // Draw both for a tie
    plotTopMarginal();
    plotRightMarginal();
  } else if (blueY > redY) {
    plotTopMarginal();
  } else {
    plotRightMarginal();
  }
}


export function plotAggregatedMarginal({
  isRed,
  Y,
  flatData,
  blueMarginal,
  redMarginal,
  margin,
  width,
  height
}) {
  // quick no-op if the row’s cells are all white (existing check)
  const selector = isRed
      ? `rect[n-points-red='${Y}']`
      : `rect[n-points-blue='${Y}']`;
  const rects = d3.selectAll(selector);
  const viable = rects.filter(':not(.infeasible):not(.zero)'); // i.e., colored/feasible > 0
  if (viable.empty()) return;

  const cacheKey = `${isRed ? 'R' : 'B'}:${Y}`;
  let pSamples = AGG_CACHE.get(cacheKey);
  if (!pSamples) {
    const agg = aggregateData({ flatData, isRed, scoreMin: 21, scoreMax: 30 });
    pSamples = agg[Y] || [];
    AGG_CACHE.set(cacheKey, pSamples);
  }
  if (!pSamples.length) {
    (isRed ? redMarginal : blueMarginal).selectAll('.kde').remove();
    return;
  }

  const kde = KDE(pSamples);
  const yMax = d3.max(kde, d => d.y) || 0;
  const marginalSvg = isRed ? redMarginal : blueMarginal;
  const colorScale = isRed ? redScale : blueScale;

  if (isRed) {
    const redW = +redMarginal.attr('width') || margin.right;
    const x = d3.scaleLinear().domain([0, yMax]).range([0, redW]);
    const y = d3.scaleLinear().domain([0, 1]).range([0, height]);

    const gradId = ensureGradient(marginalSvg, 'red-marginal-gradient', 'vertical', STOPS, colorScale);

    const area = d3.area()
      .x0(0)
      .x1(d => x(d.y))
      .y(d => y(d.x))
      .curve(d3.curveBasis);

    marginalSvg.selectAll('path.kde')
      .data([kde])
      .join('path')
      .attr('class', 'kde')
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', 'none')
      .attr('d', area);

    marginalSvg.selectAll('.secondary-y-axis').raise();

  } else {
    const x = d3.scaleLinear().domain([0, 1]).range([margin.left, margin.left + width]);
    const y = d3.scaleLinear().domain([0, yMax]).range([margin.top, 0]);

    const gradId = ensureGradient(marginalSvg, 'blue-marginal-gradient', 'horizontal', STOPS, colorScale);

    const area = d3.area()
      .x(d => x(d.x))
      .y0(margin.top)
      .y1(d => y(d.y))
      .curve(d3.curveBasis);

    marginalSvg.selectAll('path.kde')
      .data([kde])
      .join('path')
      .attr('class', 'kde')
      .attr('fill', `url(#${gradId})`)
      .attr('stroke', 'none')
      .attr('d', area);

    marginalSvg.selectAll('.secondary-x-axis').raise();
  }
}


function aggregateData({ flatData, isRed, scoreMin, scoreMax }) {
  const L = flatData[0]?.p?.length || 0;
  const buckets = {};

  for (let s = scoreMin; s <= scoreMax; s++) buckets[s] = new Float32Array(L);

  for (let i = 0, n = flatData.length; i < n; i++) {
    const row = flatData[i];
    const score = isRed ? row.red : row.blue;
    if (score < scoreMin || score > scoreMax) continue;

    const target = buckets[score];
    const p = row.p;
    for (let k = 0; k < L; k++) target[k] += (p[k] || 0);
  }

  const out = {};
  for (let s = scoreMin; s <= scoreMax; s++) out[s] = Array.from(buckets[s]);
  return out;
}
