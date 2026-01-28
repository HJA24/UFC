
export function makeGradient(svg, id, horizontal, colorFn) {
  const g = svg.append("defs").append("linearGradient")
    .attr("id", id)
    .attr("x1", "0%").attr("y1", "0%")
    .attr("x2", horizontal ? "100%" : "0%")
    .attr("y2", horizontal ? "0%" : "100%");

  const stops = d3.range(0, 1.01, 0.05);
  g.selectAll("stop").data(stops).enter().append("stop")
    .attr("offset", d => `${d * 100}%`).attr("stop-color", colorFn);
}

export function renderLegends({
  blueLegend, redLegend,
  width, height,
  margin,
  blueLegendHeight, redLegendWidth,
  blueScale, redScale
}) {
  // Blue (top) gradient strip + label
  makeGradient(blueLegend, "blue-gradient", true, d => blueScale(d));
  blueLegend.append("rect")
    .attr("x", margin.left).attr("y", 0)
    .attr("width", width).attr("height", blueLegendHeight)
    .attr("fill", "url(#blue-gradient)");

  const legendAxisG = blueLegend.append("g")
    .attr("class", "secondary-y-axis")
    .attr("transform", `translate(${margin.left}, 0)`)
    .call(d3.axisBottom(d3.scaleLinear().domain([0, 1]).range([0, width])).tickValues([]).tickSize(0));
  legendAxisG.select(".domain").remove();
  legendAxisG.append("text")
    .attr("id", "probability-label")
    .attr("class", "axis-label")
    .attr("x", width / 2).attr("y", -margin.top / 2)
    .attr("fill", "black").attr("text-anchor", "middle")
    .text("Probability");

  // Red legend
  makeGradient(redLegend, "red-gradient", false, d => redScale(d));
  redLegend.append("rect")
    .attr("x", 0).attr("y", 0)
    .attr("width", redLegendWidth).attr("height", height)
    .attr("fill", "url(#red-gradient)");

  // Cosmetic axis (no ticks)
  redLegend.append("g")
    .attr("class", "secondary-x-axis")
    .attr("transform", "translate(0, 0)")
    .call(d3.axisRight(d3.scaleLinear().domain([0, 1]).range([0, height])).tickValues([]).tickSize(0));
}
