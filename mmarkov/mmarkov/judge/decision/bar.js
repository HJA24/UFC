import {hdis} from './hdi.js';
import {kernelDensityEstimator, kernelEpanechnikov} from './kde.js';

const ICON_PATH = "icons/";
const ICON_SIZE = 35;
const ICON_GAP = 5;

const marginTop = 50, marginRight = 50, marginLeft = 300;
const rowStep = 50, barPadding = 0.2, duration = 1000, width = 1000, height = 500;

const x = d3.scaleLinear().range([marginLeft, width - marginRight]);
const barHeight = rowStep * (1 - barPadding);


const ps = [0.5, 0.75, 0.9, 0.95];
const kernelConstant = 0.05;


const scaleY = d3.scaleLinear()
    .domain([0, 1])
    .range([barHeight, 0]);

const shapeArea = d3.area()
    .curve(d3.curveBasis)
    .x(d => x(d[0]))                 // d = [x, yNorm]
    .y0(() => scaleY(0))             // constant baseline in normalized space
    .y1(d => scaleY(d[1]));          // top = normalized y


let isBar = true;
let isDensity = false;
let navigating = false;
let morphing = false;


Promise.all([
    d3.json("tree.json"),
    d3.json("12447.json"),
    d3.json("colours.json")
]).then(([tree, data, colours]) => {
    const decisions = tree.decisions;
    const views = tree.views;

    for (const [d, decision] of Object.entries(decisions)) {
        const posterior = data[d];
        decision.posterior = posterior;
        decision.hdi = hdis(posterior, ps);
    }

    function color(f, p) {
        return colours?.[f]?.[String(p)] || "#cccccc";
    }

    function getDecisions(view) {
        return view.decisions.map(d => decisions[d]);
    }

    function getXmax(d) {
        if (!d.hdi) return 1;
        return d3.max(ps, p => {
            const [, hdiMax] = d.hdi[String(p)];
            return hdiMax;
        }) || 1;
    }

    function computeDensityScale(decisions) {
        let globalMax = 0;

        decisions.forEach(d => {
            const density = kernelDensityEstimator(
                kernelEpanechnikov(kernelConstant),
                x.ticks(100)
            )(d.posterior);

            const localMax = d3.max(density, v => v[1]) || 0;
            if (localMax > globalMax) {
                globalMax = localMax;
            }
        });

        densityScale = d3.scaleLinear()
            .domain([0, globalMax])
            .range([0, 1.1]);
    }

    function morphToDensity() {
        if (morphing || isDensity) return;

        morphing = true;
        isDensity = true;

        try {
            d3.selectAll("path.hdi").each(function () {
                const path = d3.select(this);
                const datum = path.datum();

                const barArea = datum.bar;
                const densityArea = datum.density;

                path.transition()
                    .duration(duration)
                    .attrTween("d", function () {
                        const interp = d3.interpolateArray(barArea, densityArea);
                        return t => shapeArea(interp(t));
                    });
            });
        } finally {
            morphing = false;
            isBar = false;
        }
    }

    function morphToBar() {
        if (morphing || isBar) return;

        morphing = true;
        isBar = true;

        try {
            d3.selectAll("path.hdi").each(function () {
                const path = d3.select(this);
                const datum = path.datum();

                const barArea = datum.bar;
                const densityArea = datum.density;

                path.transition()
                    .duration(duration)
                    .attrTween("d", function () {
                        const interp = d3.interpolateArray(densityArea, barArea);
                        return t => shapeArea(interp(t));
                    });
            });
        } finally {
            morphing = false;
            isDensity = false;
        }
    }

    let currentView = views["1"];
    let currentDecisions = getDecisions(currentView);
    let xMax = d3.max(currentDecisions, d => getXmax(d)) || 1;

    function renderAxes(g) {
        g.attr("class", "x-axis")
            .attr("transform", `translate(0, ${
                marginTop + currentDecisions.length * rowStep + 10
            })`);

        g.append("text")
            .attr("class", "x-axis-label")
            .attr("x", (marginLeft + (width - marginRight)) / 2)
            .attr("y", 70)
            .attr("dy", "-2.5em")
            .attr("text-anchor", "middle")
            .attr("pointer-events", "none")
            .style("fill", "black")
            .text("Probability");
    }

    function updateAxes(g) {
        x.domain([0, xMax]).nice();

        g.attr("transform", `translate(0, ${
            marginTop + currentDecisions.length * rowStep + 10
        })`);

        g.call(d3.axisBottom(x).ticks(width / 80));
    }

    function update(sel) {
        return sel
            .transition()
            .duration(duration)
            .attr('transform', (d, i) => `translate(0, ${i * rowStep})`);
    }

    function enter(sel) {
        const decisions = sel
            .append('g')
            .attr('class', 'decision');

        decisions.each(function (b, i) {
            renderDecision(d3.select(this), b, i);
        });

        const paths = decisions.selectAll('path.hdi')
            .interrupt();

        paths.each(function () {
            const path = d3.select(this);
            const datum = path.datum();

            const barArea = datum.bar;
            const initBarArea = barArea.map(([_, y]) => [0, y]);

            path.style("opacity", 0)
                .transition()
                .duration(duration)
                .attrTween("d", function () {
                    const interp = d3.interpolateArray(initBarArea, barArea);
                    return t => shapeArea(interp(t));
                })
                .style("opacity", 1);
        });

        return decisions;
    }

    function exit(sel) {
        sel.selectAll('.icon-image, .icon-tooltip')
            .interrupt()
            .style("opacity", 0);

        const paths = sel.selectAll('path.hdi')
            .interrupt();

        paths.each(function () {
            const path = d3.select(this);
            const datum = path.datum();

            const barArea = datum.bar;
            const initBarArea = barArea.map(([, y]) => [0, y]);

            path.transition()
                .duration(duration / 1.75)
                .attrTween("d", function () {
                    const interp = d3.interpolateArray(barArea, initBarArea);
                    return t => shapeArea(interp(t));
                })
                .style("opacity", 0);
        });

        return sel
            .interrupt()
            .transition()
            .delay(duration)
            .remove();
    }


    function renderDecision(decision, d, i) {
        decision
            .attr("class", "decision")
            .attr("decision_id", d.decision_id)
            .attr("transform", `translate(0, ${i * rowStep})`)
            .attr("cursor", d.children ? "pointer" : "default");

        ps.forEach(p => {
            const [hdiMin, hdiMax] = d.hdi[String(p)];

            const density = kernelDensityEstimator(
                kernelEpanechnikov(kernelConstant),
                x.ticks(100)
            )(d.posterior);

            const pDensity = density.filter(([x]) => x >= hdiMin && x <= hdiMax);
            const densityMax = d3.max(pDensity, v => v[1]) || 0;

            let densityScale = d3.scaleLinear()
                .domain([0, densityMax])
                .range([0, 1.1]);


            const barArea = pDensity.map(([x]) => [x, 0.5]);
            const densityArea = pDensity.map(([x, y]) => [
                x,
                densityScale(y)
            ]);

            decision.append("path")
                .datum({bar: barArea, density: densityArea})
                .attr("class", "hdi")
                .attr("p", p)
                .attr("stroke-width", 2)
                .attr("fill", color(d.fighter, p))
                .attr("d", shapeArea(barArea));
        });

        // Icon
        decision.append("image")
            .attr("class", "icon-image")
            .attr("href", `${ICON_PATH}${d.decision_id}.svg`)
            .attr("width", ICON_SIZE)
            .attr("height", ICON_SIZE)
            .attr("x", marginLeft - ICON_GAP - ICON_SIZE)
            .attr("y", (barHeight - ICON_SIZE) / 2)
            .style("opacity", 0)
            .transition()
            .duration(duration)
            .style("opacity", 1);

        // Tooltip text
        decision.append("text")
            .attr("class", "icon-tooltip")
            .text(d.description)
            .attr("x", marginLeft - ICON_GAP - ICON_SIZE)
            .attr("y", rowStep / 2)
            .style("display", "none")
            .style("pointer-events", "none");

        decision.on("mouseenter", function () {
            d3.select(this).select(".icon-image").style("display", "none");
            d3.select(this).select(".icon-tooltip").style("display", "block");
        });

        decision.on("mouseleave", function () {
            d3.select(this).select(".icon-tooltip").style("display", "none");
            d3.select(this).select(".icon-image").style("display", "block");
        });

        decision.on("click", function (event, d) {
            event.stopPropagation();

            if (d.children && currentView.down) {
                showView(currentView.down[d.decision_id]);
            }
        });
    }

    async function renderDecisions(data) {
        const decisions = svg.select('.view').selectAll(".decision")
            .data(data, d => d.decision_id);

        const decisionsExit = exit(decisions.exit());
        const decisionsEnter = enter(decisions.enter());

        let decisionsMerge = decisionsEnter.merge(decisions);
        decisionsMerge = decisionsMerge.sort((i, j) => d3.descending(i.hdi["0.5"][1], j.hdi["0.5"][1]));

        const decisionsUpdate = update(decisionsMerge);

        await Promise.allSettled([
            decisionsExit.end(),
            decisionsUpdate.end()
        ]);
    }

    async function showView(view_id) {
        if (navigating) return;
        navigating = true;

        try {
            currentView = views[view_id];
            const decisions = getDecisions(currentView);
            currentDecisions = decisions;

            xMax = d3.max(decisions, b => getXmax(b)) || 1;

            svg.selectAll(".x-axis")
                .transition()
                .duration(duration)
                .call(updateAxes);

            await renderDecisions(decisions);

        } finally {
            navigating = false;
        }
    }

    const svg = d3.select("#chart")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", "100%")
        .attr("height", height)
        .on("click", function () {
            if (currentView.up != null) {
                if (isDensity) {
                    morphToBar();
                }
                showView(currentView.up);
            }
        });

    svg.append("g")
        .call(renderAxes)
        .call(updateAxes);

    svg.append("g")
        .attr("class", "view")
        .attr("transform", `translate(0, ${marginTop + rowStep * barPadding})`);

    renderDecisions(currentDecisions);

    document.getElementById("button-density").addEventListener("click", morphToDensity);
    document.getElementById("button-bar").addEventListener("click", morphToBar);
});
