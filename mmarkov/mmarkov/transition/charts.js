// ----- Utility -----
export const invLogit = x => 1 / (1 + Math.exp(-x));

// ----- Constants -----
const n = 50;
const logitMargin = { top: 20, right: 20, bottom: 20, left: 40 },
      logitSize = { width: 500, height: 150 };
const pmfMargin = { top: 30, right: 30, bottom: 30, left: 50 },
      pmfSize = { width: 500, height: 300 };

const logitWidth = logitSize.width - logitMargin.left - logitMargin.right,
      logitHeight = logitSize.height - logitMargin.top - logitMargin.bottom;
const pmfWidth = pmfSize.width - pmfMargin.left - pmfMargin.right,
      pmfHeight = pmfSize.height - pmfMargin.top - pmfMargin.bottom;

// ----- Logit SVG Setup -----
const logitSvg = d3.select("svg")
    .attr("width", logitSize.width)
    .attr("height", logitSize.height)
    .append("g")
    .attr("transform", `translate(${logitMargin.left},${logitMargin.top})`);

const xScale = d3.scaleLinear().domain([-10, 10]).range([0, logitWidth]);
const yScale = d3.scaleLinear().domain([0, 1]).range([logitHeight, 0]);

logitSvg.append("g")
    .attr("transform", `translate(0,${logitHeight})`)
    .call(d3.axisBottom(xScale).ticks(5));

logitSvg.append("g")
    .call(d3.axisLeft(yScale).tickValues([0, 0.5, 1]).tickFormat(d => d.toFixed(1)));

logitSvg.append("path")
    .datum(d3.range(-10, 10.01, 0.1).map(x => ({ x, y: invLogit(x) })))
    .attr("fill", "none")
    .attr("stroke", "rgba(100, 100, 100, 0.33)")
    .attr("stroke-width", 2)
    .attr("d", d3.line().x(d => xScale(d.x)).y(d => yScale(d.y)));

logitSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", logitWidth / 2)
    .attr("y", logitHeight + logitMargin.bottom - 5);
// Y-Axis Label
logitSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -logitHeight / 2)
    .attr("y", -logitMargin.left + 10)
    .text("θ");

const dot = logitSvg.append("circle")
    .attr("id", "current-point")
    .attr("r", 4)
    .attr("fill", "gray");

// ----- PMF SVG Setup -----
const pmfSvg = d3.select("#pmf-chart")
    .attr("width", pmfSize.width)
    .attr("height", pmfSize.height)
    .append("g")
    .attr("transform", `translate(${pmfMargin.left},${pmfMargin.top})`);

const xPMF = d3.scaleBand().domain(d3.range(n + 1)).range([0, pmfWidth]).padding(0.1);
const yPMF = d3.scaleLinear().domain([0, 0.15]).range([pmfHeight, 0]);

const xAxisPMF = pmfSvg.append("g")
    .attr("transform", `translate(0,${pmfHeight})`)
    .call(d3.axisBottom(xPMF).tickValues([0, 10, 20, 30, 40, 50]));

const yAxisPMF = pmfSvg.append("g")
    .call(d3.axisLeft(yPMF).ticks(10));

// Axis labels
pmfSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("x", pmfWidth / 2)
    .attr("y", pmfHeight + pmfMargin.bottom - 5)
    .text("k");

pmfSvg.append("text")
    .attr("text-anchor", "middle")
    .attr("transform", "rotate(-90)")
    .attr("x", -pmfHeight / 2)
    .attr("y", -pmfMargin.left + 10)
    .text("P(X = k)");

// ----- Binomial PMF Calculation -----
function binomialPMF(n, p) {
    const coef = k => {
        let res = 1;
        for (let i = 1; i <= k; ++i) res *= (n - i + 1) / i;
        return res;
    };
    return d3.range(n + 1).map(k => ({
        k,
        prob: coef(k) * p ** k * (1 - p) ** (n - k)
    }));
}

// ----- Update Function -----
function update() {
    const lambdaBlue = parseFloat(document.getElementById("blueRange").value),
          lambdaRed = parseFloat(document.getElementById("redRange").value),
          delta = lambdaBlue - lambdaRed,
          theta = invLogit(delta);

    dot.attr("cx", xScale(delta)).attr("cy", yScale(theta));

    const data = binomialPMF(n, theta),
          maxProb = d3.max(data, d => d.prob);

    yPMF.domain([0, maxProb * 1.1]);
    yAxisPMF.transition().duration(200).call(d3.axisLeft(yPMF).ticks(10));

    const bars = pmfSvg.selectAll(".bar").data(data, d => d.k);

    bars.enter().append("rect")
        .attr("class", "bar")
        .attr("x", d => xPMF(d.k))
        .attr("width", xPMF.bandwidth())
        .attr("y", pmfHeight)
        .attr("height", 0)
        .attr("fill", "rgba(100, 100, 100, 0.66)")
        .merge(bars)
        .transition()
        .duration(300)
        .attr("y", d => yPMF(d.prob))
        .attr("height", d => pmfHeight - yPMF(d.prob));

    bars.exit().remove();
}

// ----- Event Listeners -----
["blueRange", "redRange"].forEach(id =>
    document.getElementById(id).addEventListener("input", update)
);

// ----- Initial Render -----
update();
