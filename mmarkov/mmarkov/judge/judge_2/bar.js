import {hdis} from '../decision/hdi.js'; // <-- make sure this path is correct

const ps = [0.5, 0.75, 0.9, 0.95];

Promise.all([
    d3.json("../data.json"),   // adjust paths as needed
    d3.json("../colours.json")
]).then(([data, colours]) => {


    function color(f, p) {
        return colours?.[f]?.[String(p)] || "#cccccc";
    }

    function getSideXmax(side) {
        if (!side || !side.hdi) return 0;
        return d3.max(ps, p => {
            const [, hdiMax] = side.hdi[String(p)];
            return hdiMax;
        }) || 0;
    }

    const records = Object.values(data);

    const rolled = d3.rollup(
        records,
        v => v[0].p,    // posterior
        d => d.blue,
        d => d.red
    );


    const scorecards = {};

    for (const [blue, reds] of rolled) {
        for (const [red, posterior] of reds) {

            if (blue === red) continue;

            const max = Math.max(blue, red);
            const min = Math.min(blue, red);

            if (!scorecards[max]) scorecards[max] = {};
            if (!scorecards[max][min]) {
                scorecards[max][min] = {blue: {}, red: {}};
            }

            const side = blue > red ? 'blue' : 'red';

            scorecards[max][min][side].posterior = posterior;
            scorecards[max][min][side].hdi = hdis(posterior, ps);
        }
    }

    const rows = [];

    for (const [hi, lows] of Object.entries(scorecards)) {
        for (const [lo, obj] of Object.entries(lows)) {
            rows.push({
                key: `${hi}-${lo}`,
                hi: +hi,
                lo: +lo,
                blue: obj.blue,   // { posterior, hdi } or {}
                red: obj.red     // { posterior, hdi } or {}
            });
        }
    }

    rows.sort((a, b) =>
        d3.descending(a.hi, b.hi) || d3.descending(a.lo, b.lo)
    );


    const xMax = d3.max(rows, r =>
        Math.max(getSideXmax(r.blue), getSideXmax(r.red))
    ) || 1;


    const marginTop = 40,
        marginRight = 40,
        marginBottom = 40,
        marginLeft = 200;

    const width = 1000;
    const rowStep = 40;

    // Height based on number of rows
    const height = marginTop + marginBottom + rows.length * rowStep;

    const svg = d3.select("#chart")
        .attr("viewBox", [0, 0, width, height])
        .attr("width", "100%")
        .attr("height", height);

    // x goes from -xMax (blue side) to +xMax (red side)
    const x = d3.scaleLinear()
        .domain([-xMax, xMax])
        .range([marginLeft, width - marginRight])
        .nice();

    // y is banded by pair
    const y = d3.scaleBand()
        .domain(rows.map(d => d.key))
        .range([marginTop, height - marginBottom])
        .padding(0.2);

    const barHeight = y.bandwidth();

    const xAxis = d3.axisBottom(x)
        .tickFormat(t => Math.abs(t))
        .ticks(width / 80);

    svg.append("g")
        .attr("class", "x-axis")
        .attr(
            "transform",
            `translate(0, ${height - marginBottom + 20})`
        )
        .call(xAxis);


    const row = svg.append("g")
        .attr("class", "rows")
        .selectAll(".pair")
        .data(rows)
        .enter()
        .append("g")
        .attr("class", "pair")
        .attr("transform", d => `translate(0, ${y(d.key)})`);

    // Label on the left of each row
    row.append("text")
        .attr("class", "pair-label")
        .attr("x", marginLeft - 10)
        .attr("y", barHeight / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => `${d.hi}-${d.lo}`);

    // --- BLUE bars (left/negative side) --------------------------------

    row.each(function (d) {
        const g = d3.select(this);
        const side = d.blue;
        if (!side || !side.hdi) return;

        ps.forEach(p => {
            const [hdiMin, hdiMax] = side.hdi[String(p)];
            const x0 = x(-hdiMax);
            const x1 = x(-hdiMin);

            g.append("rect")
                .attr("class", "bar blue")
                .attr("x", x0)
                .attr("y", 0)
                .attr("width", Math.max(0, x1 - x0))
                .attr("height", barHeight)
                .attr("fill", color('blue', p));
        });
    });


    row.each(function (d) {
        const g = d3.select(this);
        const side = d.red;
        if (!side || !side.hdi) return;

        ps.forEach(p => {
            const [hdiMin, hdiMax] = side.hdi[String(p)];
            const x0 = x(hdiMin);
            const x1 = x(hdiMax);

            g.append("rect")
                .attr("class", "bar red")
                .attr("x", x0)
                .attr("y", 0)
                .attr("width", Math.max(0, x1 - x0))
                .attr("height", barHeight)
                .attr("fill", color('red', p));
        });
    });

});