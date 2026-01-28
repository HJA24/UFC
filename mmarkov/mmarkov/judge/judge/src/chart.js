import {plotMarginal} from "./marginals.js";
import {redScale, blueScale, purpleScale} from "./colours.js";
import {CONFIG} from "./config.js";
import {fmtInt, fmtProb} from "./utils.js";
import {renderLegends} from "./legends.js";
import {attachDynamicTickAndMarker} from "./marginalInteraction.js";
import {attachAxisHover} from "./axes.js";
import {setLocked, isLocked} from "./lock.js";

/* ---------- DOM ---------- */
const sel = {
    jointPlot: d3.select("#joint-plot"),
    blueMarginal: d3.select("#top-marginal"),
    redMarginal: d3.select("#right-marginal"),
    blueLegend: d3.select("#top-legend"),
    redLegend: d3.select("#right-legend"),
};

const {margin, width, height, rightMarginalWidth, blueLegendHeight, baseTicks} = CONFIG;

sel.jointPlot.attr("width", width + margin.left).attr("height", height);
sel.blueMarginal.attr("height", margin.top).attr("width", width);
sel.redMarginal.attr("height", height).attr("width", rightMarginalWidth);
sel.blueLegend.attr("width", width).attr("height", blueLegendHeight);
sel.redLegend.attr("width", CONFIG.redLegendWidth).attr("height", width);

/* ---------- Helpers ---------- */
const clearMarginals = () => d3.selectAll(".kde").remove();

const afterRenderMarginalsPENone = () => {
    sel.blueMarginal.selectAll(".kde, .kde *").attr("pointer-events", "none");
    sel.redMarginal.selectAll(".kde, .kde *").attr("pointer-events", "none");
};

// keep only the selected red & blue tick visible; hide the rest
function showOnlySelectedScores(scoreRed, scoreBlue) {
    sel.jointPlot.selectAll(".x-axis .tick")
        .style("display", t => (t === scoreRed ? null : "none"));
    sel.jointPlot.selectAll(".y-axis .tick")
        .style("display", t => (t === scoreBlue ? null : "none"));
}

// ONLY blue tick visible (e.g., user selects blue = 30)
function showOnlyBlueTick(selectedBlue) {
    sel.jointPlot.selectAll(".y-axis .tick")
        .style("display", t => (t === selectedBlue ? null : "none"));
}

// (optional) show only red tick visible
function showOnlyRedTick(selectedRed) {
    sel.jointPlot.selectAll(".x-axis .tick")
        .style("display", t => (t === selectedRed ? null : "none"));
}

function resetTickVisibility() {
    sel.jointPlot.selectAll(".x-axis .tick, .y-axis .tick")
        .style("display", null);
}

/* ---------- Scales & axes ---------- */
const scoreMin = CONFIG.numberOfRounds * 7;
const scoreMax = CONFIG.numberOfRounds * 10;
const scoreTicks = d3.range(scoreMin, scoreMax + 1);

const xScale = d3.scaleLinear().domain([scoreMin, scoreMax + 1]).range([margin.left, margin.left + width]);
const yScale = d3.scaleLinear().domain([scoreMin, scoreMax + 1]).range([height, 0]);
const cellWidth = xScale(scoreMin + 1) - xScale(scoreMin);

function addAxis(g, cls, transform, axis, label, lx, ly, rotate = 0) {
    const a = g.append("g").attr("class", cls).attr("transform", transform).call(axis);
    a.append("text").attr("class", "axis-label").attr("x", lx).attr("y", ly)
        .attr("fill", "black").attr("text-anchor", "middle")
        .attr("transform", rotate ? `rotate(${rotate})` : null)
        .text(label);
    return a;
}

addAxis(
    sel.jointPlot, "x-axis", `translate(0, ${height})`,
    d3.axisBottom(xScale).tickValues(scoreTicks).tickFormat(fmtInt),
    "Number of points - red", margin.left + width / 2, margin.bottom
);

addAxis(
    sel.jointPlot, "y-axis", `translate(${margin.left}, 0)`,
    d3.axisLeft(yScale).tickValues(scoreTicks).tickFormat(fmtInt),
    "Number of points - blue", -height / 2, -margin.left, -90
);

// nudge labels into cell centers
sel.jointPlot.selectAll(".x-axis .tick text").attr("x", cellWidth / 2);
sel.jointPlot.selectAll(".y-axis .tick text").attr("y", -cellWidth / 2);

// make sure axes sit above the grid so labels are interactive
sel.jointPlot.select(".x-axis").raise();
sel.jointPlot.select(".y-axis").raise();

/* ---------- Legends ---------- */
renderLegends({
    blueLegend: sel.blueLegend,
    redLegend: sel.redLegend,
    width, height, margin,
    blueLegendHeight,
    redLegendWidth: CONFIG.redLegendWidth,
    blueScale, redScale
});

/* ---------- Data, grid, and interactions ---------- */
(async function init() {
    const probability = await d3.json("../data.json");
    const rows = Object.values(probability).map(r => ({
        red: +r.red,
        blue: +r.blue,
        p: Array.isArray(r.p) ? r.p.map(Number) : [Number(r.p)]
    }));

    // Build heatmap cells
    const key = (r, b) => `${+r},${+b}`;
    const binMap = d3.rollup(
        rows,
        group => d3.mean(group.flatMap(d => d.p)),
        d => d.red, d => d.blue
    );

    const feasibleScores = new Set(Object.values(probability).map(({red, blue}) => key(red, blue)));
    const isFeasible = (r, b) => feasibleScores.has(key(r, b));

    const gridCells = d3.cross(scoreTicks, scoreTicks).map(([red, blue]) => {
        const value = binMap.get(red)?.get(blue) ?? 0;
        const type = red > blue ? "red" : blue > red ? "blue" : "tie";
        return {red, blue, value, type, infeasible: !isFeasible(red, blue)};
    });

    const getProbabilityScorecard = (r, b) =>
        rows.filter(rr => rr.red === r && rr.blue === b).flatMap(rr => rr.p);

    // Grid rects
    sel.jointPlot.append("g")
        .selectAll("rect")
        .data(gridCells)
        .join("rect")
        .classed("infeasible", d => d.infeasible)
        .classed("zero", d => !d.infeasible && d.value < 0.0001)
        .attr("n-points-blue", d => d.blue)
        .attr("n-points-red", d => d.red)
        .attr("x", d => xScale(d.red))
        .attr("y", d => yScale(d.blue + 1))
        .attr("width", cellWidth)
        .attr("height", cellWidth)
        .attr("fill", d =>
          d.infeasible ? null :
          d.value < 0.0001 ? null :
          d.type === "red"  ? redScale(d.value)  :
          d.type === "blue" ? blueScale(d.value) :
                              purpleScale(d.value)
        )
        .attr("stroke", null)
        .attr("stroke", "#eee")
        .on("mouseover", function (event, d) {
            if (isLocked()) return;
            d3.select(this)
                .style("transform", "scale(1.05)")
                .style("transform-box", "fill-box")
                .style("transform-origin", "center");
            sel.jointPlot.selectAll(".x-axis .tick text").classed("highlight-tick", t => t === d.red);
            sel.jointPlot.selectAll(".y-axis .tick text").classed("highlight-tick", t => t === d.blue);

            if (d.value > 0.0001) {
                const pSamples = getProbabilityScorecard(d.red, d.blue);
                plotMarginal({
                    blueY: d.blue, redY: d.red, pSamples,
                    redMarginal: sel.redMarginal, blueMarginal: sel.blueMarginal,
                    margin, width, height, transitionDuration: 500
                });
                afterRenderMarginalsPENone();
            }
        })
        .on("mouseout", function () {
            if (isLocked()) return;
            sel.jointPlot.selectAll(".x-axis .tick text, .y-axis .tick text").classed("highlight-tick", false);
            d3.select(this).style("transform", null);
            clearMarginals();
        })
        .on("click", (event, d) => {
            if (d.infeasible) return;
            event.stopPropagation();
            setLocked(true);
            showOnlySelectedScores(d.red, d.blue);
        })
        .on("dblclick", (event, d) => {
            d3.select(event.currentTarget)
                .style("transform", "scale(1.05)")
                .style("transform-box", "fill-box")
                .style("transform-origin", "center");
            clearMarginals();
            setLocked(false);
            resetTickVisibility();

            if (d.value > 0.0001) {
                const pSamples = getProbabilityScorecard(d.red, d.blue);
                plotMarginal({
                    blueY: d.blue, redY: d.red, pSamples,
                    redMarginal: sel.redMarginal, blueMarginal: sel.blueMarginal,
                    margin, width, height, transitionDuration: 500
                });
                afterRenderMarginalsPENone();
            }
        });

    // Static marginal axes
    sel.blueMarginal.append("g")
        .attr("class", "secondary-x-axis")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(
            d3.axisTop(d3.scaleLinear().domain([0, 1]).range([0, width]))
                .tickValues(baseTicks).tickFormat(fmtProb).tickSize(0)
        );

    sel.redMarginal.append("g")
        .attr("class", "secondary-y-axis")
        .attr("transform", "translate(0, 0)")
        .call(
            d3.axisRight(d3.scaleLinear().domain([0, 1]).range([0, height]))
                .tickValues(baseTicks).tickFormat(fmtProb).tickSize(0)
        );

    // Dynamic marginal ticks + marker
    attachDynamicTickAndMarker({
        svg: sel.blueMarginal,
        axisGroup: sel.blueMarginal.select(".secondary-x-axis"),
        scale: d3.scaleLinear().domain([0, 1]).range([0, width]),
        axisFactory: ticks => d3.axisTop(d3.scaleLinear().domain([0, 1]).range([0, width])).tickValues(ticks),
        orientation: "horizontal",
        overlay: {x: margin.left, y: 0, width, height: margin.top},
        pxTol: CONFIG.tickOverlapPx,
        zeroTolPx: CONFIG.zeroTolPx,
        pathSelector: "path.kde, .kde path",
        markerRadius: 3
    });

    attachDynamicTickAndMarker({
        svg: sel.redMarginal,
        axisGroup: sel.redMarginal.select(".secondary-y-axis"),
        scale: d3.scaleLinear().domain([0, 1]).range([0, height]),
        axisFactory: ticks => d3.axisRight(d3.scaleLinear().domain([0, 1]).range([0, height])).tickValues(ticks),
        orientation: "vertical",
        overlay: {x: 0, y: 0, width: CONFIG.rightMarginalWidth, height},
        pxTol: CONFIG.tickOverlapPx,
        zeroTolPx: CONFIG.zeroTolPx,
        pathSelector: "path.kde, .kde path",
        markerRadius: 3
    });

    // Axis tick hover (grid axes) → show aggregated marginals (attachAxisHover imports lock/isFeasible)
    attachAxisHover({
        jointPlot: sel.jointPlot,
        selector: ".x-axis .tick text",
        offsetAttr: "x",
        offsetVal: cellWidth / 2,
        isRed: true,
        rows,
        blueMarginal: sel.blueMarginal,
        redMarginal: sel.redMarginal,
        margin, width, height,
        isFeasible
    });

    attachAxisHover({
        jointPlot: sel.jointPlot,
        selector: ".y-axis .tick text",
        offsetAttr: "y",
        offsetVal: -cellWidth / 2,
        isRed: false,
        rows,
        blueMarginal: sel.blueMarginal,
        redMarginal: sel.redMarginal,
        margin, width, height,
        isFeasible
    });
})();
