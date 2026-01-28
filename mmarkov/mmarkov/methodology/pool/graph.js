import {loadAndPopulateTable, clearTable} from './table.js';

const width = 800, height = 800;
let fightData = {};

// Entry point
initGraph();

function initGraph() {
    d3.json("fights.json").then(data => {
        fightData = data;
        renderGraph(getNodes(), getLinks(), fightData);
    });
}

function renderGraph(nodes, links, fightData) {
    const svg = d3.select("svg")
        .attr("viewBox", [0, 0, width, height]);

    const radius = 300;
    nodes.forEach((d, i) => {
        const angle = (i / nodes.length) * 2 * Math.PI;
        d.x = width / 2 + radius * Math.cos(angle);
        d.y = height / 2 + radius * Math.sin(angle);
    });

    const connectedMap = new Map();
    nodes.forEach(n => connectedMap.set(n.id, new Set()));
    links.forEach(l => {
        connectedMap.get(l.source).add(l.target);
        connectedMap.get(l.target).add(l.source);
    });

    const link = svg.append("g")
        .selectAll("path")
        .data(links)
        .join("path")
        .attr("class", "link")
  .attr("d", d => {
    const src = getNode(d.source, nodes), tgt = getNode(d.target, nodes);
    return `M${src.x},${src.y} L${tgt.x},${tgt.y}`;
  })
  .attr("stroke-width", d => d.n * 1.75); // 🔥 stroke width = n × 3

    const node = svg.selectAll(".node")
        .data(nodes)
        .join("g")
        .attr("class", "node")
        .attr("transform", d => `translate(${d.x},${d.y})`);

    node.append("circle")
        .attr("r", 40)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("stroke-width", 2)
        .attr("class", "node-border");

    node.append("circle")
        .attr("r", 40)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("stroke-width", 2)
        .attr("class", "connected-border");

    node.append("circle")
        .attr("r", 40)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("stroke-width", 2)
        .attr("class", "link-source-border");

    node.append("circle")
        .attr("r", 40)
        .attr("fill", "none")
        .attr("stroke", "none")
        .attr("stroke-width", 2)
        .attr("class", "link-target-border");

    node.append("image")
        .attr("xlink:href", d => d.img)
        .attr("width", 120)
        .attr("height", 120)
        .attr("x", -60)
        .attr("y", -60)
        .attr("clip-path", "circle(60)");

    addHoverHandlers(node, link, connectedMap, fightData);
}

function addHoverHandlers(node, link, connectedMap, fightData) {
    node.on("mouseover", function (event, d) {
        d3.select(this).classed("highlight", true);

        const connected = connectedMap.get(d.id);
        link.classed("highlight", false).classed("invisible", true);
        node.classed("invisible", true);

        link.filter(l => l.source === d.id || l.target === d.id)
            .classed("highlight", true)
            .classed("invisible", false)
            .transition().duration(2000);

        node.filter(n => n.id === d.id || connected.has(n.id))
            .classed("invisible", false)
            .transition().duration(2000);

        node.select(".connected-border").attr("stroke", "none");
        node.filter(n => connected.has(n.id) && n.id !== d.id)
            .select(".connected-border")
            .attr("stroke", "#bf0700ff");

        node.selectAll(".node-border").attr("stroke", "none");
        d3.select(this).select(".node-border").attr("stroke", "#0045b9");

        loadAndPopulateTable(d.id);
    });

    node.on("mouseout", function () {
        d3.selectAll(".node").classed("highlight", false);

        link.classed("highlight", false).classed("invisible", false)
            .transition().duration(2000);
        node.classed("invisible", false)
            .transition().duration(2000);

        node.selectAll(".node-border").attr("stroke", "none");
        node.selectAll(".connected-border").attr("stroke", "none");
        node.selectAll(".link-source-border").attr("stroke", "none");
        node.selectAll(".link-target-border").attr("stroke", "none");

        clearTable();
    });

    link.on("mouseover", function (event, d) {
        const sourceId = typeof d.source === "object" ? d.source.id : d.source;
        const targetId = typeof d.target === "object" ? d.target.id : d.target;

        // Hide everything
        link.classed("highlight", false).classed("invisible", true);
        node.classed("invisible", true);

        // Highlight and show current link
        d3.select(this).classed("highlight", true).classed("invisible", false);

        // Show connected nodes
        node.filter(n => n.id === sourceId || n.id === targetId)
            .classed("invisible", false)
            .transition().duration(2000);

        // Color source and target
        node.select(".link-source-border").attr("stroke", "none");
        node.select(".link-target-border").attr("stroke", "none");

        node.filter(n => n.id === sourceId)
            .select(".link-source-border")
            .attr("stroke", "#0045b9");

        node.filter(n => n.id === targetId)
            .select(".link-target-border")
            .attr("stroke", "#bf0700ff");

        const fights = fightData?.[sourceId]?.[targetId] || fightData?.[targetId]?.[sourceId] || [];

        loadAndPopulateTable({
            type: "link",
            sourceId,
            targetId,
            fights
        });
    });

    link.on("mouseout", function () {
        d3.select(this).classed("highlight", false);
        link.classed("invisible", false)
            .transition().duration(2000);
        node.classed("invisible", false)
            .transition().duration(2000);

        node.selectAll(".link-source-border").attr("stroke", "none");
        node.selectAll(".link-target-border").attr("stroke", "none");

        clearTable();
    });
}

function getNode(id, nodes) {
    return nodes.find(d => d.id === id);
}

function getNodes() {
    return [
        {id: '1546', name: 'Brad Tavares', img: './nodes/1546.png'},
        {id: '1806', name: 'Derek Brunson', img: './nodes/1806.png'},
        {id: '2204', name: 'Sean Strickland', img: './nodes/2204.png'},
        {id: '3314', name: 'Bruno Silva', img: './nodes/3314.png'},
        {id: '3741', name: 'Abus Magomedov', img: './nodes/3741.png'},
        {id: '3051', name: 'Israel Adesanya', img: './nodes/3051.png'},
        {id: '3085', name: 'Chris Curtis', img: './nodes/3085.png'},
        {id: '3576', name: 'Nassourdine Imavov', img: './nodes/3576.png'},
        {id: '2337', name: 'Jared Cannonier', img: './nodes/2337.png'},
        {id: '2070', name: 'Kelvin Gastelum', img: './nodes/2070.png'},
        {id: '2069', name: 'Uriah Hall', img: './nodes/2069.png'},
        {id: '2037', name: 'Robert Whittaker', img: './nodes/2037.png'},
        {id: '2775', name: 'Jack Hermansson', img: './nodes/2775.png'},
        {id: '3546', name: 'Alex Pereira', img: './nodes/3546.png'}
    ];
}

function getLinks() {
    return [
        {source: '1546', target: '2037', n: 1},
        {source: '1546', target: '3051', n: 1},
        {source: '1546', target: '3314', n: 1},
        {source: '1806', target: '2037', n: 1},
        {source: '1806', target: '2069', n: 1},
        {source: '1806', target: '2337', n: 1},
        {source: '1806', target: '3051', n: 1},
        {source: '2037', target: '1546', n: 1},
        {source: '2037', target: '1806', n: 1},
        {source: '2037', target: '2069', n: 1},
        {source: '2037', target: '2070', n: 1},
        {source: '2037', target: '2337', n: 1},
        {source: '2037', target: '3051', n: 2},
        {source: '2069', target: '1806', n: 1},
        {source: '2069', target: '2037', n: 1},
        {source: '2069', target: '2204', n: 1},
        {source: '2070', target: '2037', n: 1},
        {source: '2070', target: '2337', n: 1},
        {source: '2070', target: '2775', n: 1},
        {source: '2070', target: '3051', n: 1},
        {source: '2070', target: '3085', n: 1},
        {source: '2204', target: '2069', n: 1},
        {source: '2204', target: '2337', n: 1},
        {source: '2204', target: '2775', n: 1},
        {source: '2204', target: '3051', n: 1},
        {source: '2204', target: '3546', n: 1},
        {source: '2204', target: '3576', n: 1},
        {source: '2204', target: '3741', n: 1},
        {source: '2337', target: '1806', n: 1},
        {source: '2337', target: '2070', n: 1},
        {source: '2337', target: '2037', n: 1},
        {source: '2337', target: '2204', n: 1},
        {source: '2337', target: '2775', n: 1},
        {source: '2337', target: '3051', n: 1},
        {source: '2337', target: '3576', n: 1},
        {source: '2775', target: '2070', n: 1},
        {source: '2775', target: '2204', n: 1},
        {source: '2775', target: '2337', n: 1},
        {source: '2775', target: '3085', n: 1},
        {source: '3051', target: '1546', n: 1},
        {source: '3051', target: '1806', n: 1},
        {source: '3051', target: '2037', n: 2},
        {source: '3051', target: '2070', n: 1},
        {source: '3051', target: '2204', n: 1},
        {source: '3051', target: '2337', n: 1},
        {source: '3051', target: '3546', n: 2},
        {source: '3051', target: '3576', n: 1},
        {source: '3085', target: '2070', n: 1},
        {source: '3085', target: '2775', n: 1},
        {source: '3314', target: '1546', n: 1},
        {source: '3314', target: '3546', n: 1},
        {source: '3546', target: '2204', n: 1},
        {source: '3546', target: '3051', n: 2},
        {source: '3546', target: '3314', n: 1},
        {source: '3576', target: '2204', n: 1},
        {source: '3576', target: '2337', n: 1},
        {source: '3576', target: '3051', n: 1},
        {source: '3741', target: '2204', n: 1},
    ];
}
