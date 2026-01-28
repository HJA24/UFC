const svg = d3.select("svg");
const margin = { top: 40, right: 40, bottom: 50, left: 90 };
const width = +svg.attr("width") - margin.left - margin.right;
const height = +svg.attr("height") - margin.top - margin.bottom;

const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

svg.append("defs").append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

const x = d3.scaleLinear().domain([0, 1]).range([0, width]);
const y = d3.scaleLinear().range([height, 0]);

const xAxisGroup = g.append("g").attr("transform", `translate(0,${height})`);
const yAxisGroup = g.append("g");

const xLabel = g.append("text")
  .attr("class", "axis-label")
  .attr("x", width / 2)
  .attr("y", height + 40)
  .attr("text-anchor", "middle")
  .text("probability");

const yLabel = g.append("text")
  .attr("class", "axis-label")
  .attr("transform", "rotate(-90)")
  .attr("x", -height / 2)
  .attr("y", -65)
  .attr("text-anchor", "middle")
  .text("odds");

const chartArea = g.append("g").attr("clip-path", "url(#clip)");

const line = d3.line()
  .x(d => x(d.probability))
  .y(d => y(d.odds));

const path = chartArea.append("path")
  .attr("fill", "none")
  .attr("stroke", "rgba(100, 100, 100, 0.33)")
  .attr("stroke-width", 1.5)
  .style("stroke-dasharray", ("2, 2"));

const brush = d3.brush()
  .extent([[0, 0], [width, height]])
  .on("end", zoomed);

const brushGroup = g.append("g").attr("class", "brush").call(brush);

g.append("rect")
  .attr("class", "x-draggable")
  .attr("x", 0)
  .attr("y", height - 15)
  .attr("width", width)
  .attr("height", 30)
  .attr("opacity", 0)
  .on("mousedown", startXDrag);

let draggingX = false;
let downx = NaN;
let downScaleX;
let data = [];
let scatterData = [];

function generateData() {
  return d3.range(0.01, 0.99, 0.001).map(p => ({
    probability: p,
    odds: 1 / p
  }));
}

function renderAxes() {
  xAxisGroup.call(d3.axisBottom(x));
  yAxisGroup.call(d3.axisLeft(y));
}

function transitionAxes() {
  xAxisGroup.transition().duration(1000).call(d3.axisBottom(x));
  yAxisGroup.transition().duration(1000).call(d3.axisLeft(y));
}

function render() {
  data = generateData();
  x.domain([0, 1]);
  y.domain([1, d3.max(data, d => d.odds)]);
  renderAxes();
  path.datum(data).attr("d", line);
}

function update() {
  transitionAxes();
  path.datum(data)
    .transition()
    .duration(1000)
    .attr("d", line);

  chartArea.selectAll(".bookie-dot")
    .transition()
    .duration(1000)
    .attr("cx", d => x(d.probability))
    .attr("cy", d => y(d.odds));

  chartArea.selectAll(".bookie-label")
    .transition()
    .duration(1000)
    .attr("x", d => x(d.probability))
    .attr("y", d => y(d.odds) - 8);
}

function reset() {
  data = generateData();
  x.domain([0, 1]);
  y.domain([1, d3.max(data, d => d.odds)]);
  update();
  brushGroup.call(brush.move, null);
}

function zoomed(event) {
  if (!event.selection) return;
  const [[x0, y0], [x1, y1]] = event.selection;
  x.domain([
    Math.max(0, x.invert(x0)),
    Math.min(1, x.invert(x1))
  ]);
  y.domain([
    Math.max(1, y.invert(y1)),
    y.invert(y0)
  ]);
  update();
  brushGroup.call(brush.move, null);
}

function startXDrag(event) {
  draggingX = true;
  downx = x.invert(d3.pointer(event, this)[0]);
  downScaleX = x.copy();
  d3.select(window)
    .on("mousemove.xdrag", dragXAxis)
    .on("mouseup.xdrag", endXDrag);
}

function dragXAxis(event) {
  if (!draggingX || isNaN(downx)) return;

  const px = d3.pointer(event, g.node())[0];
  if (px === 0) return;

  const domainStart = downScaleX.domain()[0];
  const domainEnd = downScaleX.domain()[1];
  const newDomainWidth = domainEnd - domainStart;
  const newStart = downx - (px / width) * newDomainWidth;
  const newEnd = newStart + newDomainWidth;

  const clampedStart = Math.max(0, newStart);
  const clampedEnd = Math.min(1, newEnd);

  x.domain([clampedStart, clampedEnd]);
  update();
}

function endXDrag() {
  draggingX = false;
  downx = NaN;
  d3.select(window).on("mousemove.xdrag", null).on("mouseup.xdrag", null);
}

function addBookiePoint(label) {
  const p = Math.random() * 0.25;
  const odds = 1 / p + ((Math.random() * 2 - 1) * 5);
  const newPoint = { probability: p, odds, label };
  scatterData.push(newPoint);

  chartArea.selectAll(".bookie-dot")
    .data(scatterData, d => d.label)
    .join("circle")
    .attr("class", "bookie-dot")
    .attr("r", 4)
    .attr("fill", "black")
    .attr("cx", d => x(d.probability))
    .attr("cy", d => y(d.odds));

  chartArea.selectAll(".bookie-label")
    .data(scatterData, d => d.label)
    .join("text")
    .attr("class", "bookie-label")
    .attr("x", d => x(d.probability))
    .attr("y", d => y(d.odds) - 8)
    .attr("text-anchor", "middle")
    .style("font-size", "12px")
    .text(d => d.label);
}

svg.on("dblclick", reset);
render();
