function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
function curveFlowchart(alpha = 0.75) {
  return function(context) {
    let x0, y0;
    let first = true;

    return {
      lineStart() {
        first = true;
      },
      lineEnd() {},
      point(x1, y1) {
        if (first) {
          context.moveTo(x1, y1);
          first = false;
        } else {
          const xMid = x0 + alpha * (x1 - x0);  // interpolate horizontal middle
          context.lineTo(xMid, y0);  // first horizontal
          context.lineTo(xMid, y1);  // vertical
          context.lineTo(x1, y1);    // second horizontal
        }
        x0 = x1;
        y0 = y1;
      }
    };
  };
}


async function expandTree(tree, delay = 300, containerId) {
  const container = document.getElementById(containerId);

  if (!tree || !container) return;

  const root = tree.root;

  async function expandStepByStep(node) {
    if (node._children) {
      const childrenToExpand = node._children;
      node.children = [];
      node._children = null;

      for (const child of childrenToExpand) {
        node.children.push(child);
        tree.update({}, node);

        container.scrollTo({
          top: container.scrollHeight,
          behavior: "smooth"
        });

        await sleep(delay);
        if (child.data.expanded) {
          await expandStepByStep(child);
        }
      }
    }
  }

  await expandStepByStep(root);
}

function renderTree(tier) {
  const width = 1100;
  const margin = { top: 10, right: 10, bottom: 10, left: 100 };
  const dx = 17;
  const jsonFile = `${tier}.json`;

  d3.select(`svg`).selectAll("*").remove();

  d3.json(jsonFile).then(data => {
    const root = d3.hierarchy(data);
    const dy = (width - margin.left - margin.right) / (1 + root.height);
    const treeLayout = d3.tree().nodeSize([dx, dy]);
    const diagonal = d3.link(curveFlowchart(0.925)).x(d => d.y).y(d => d.x);

    const svg = d3.select(`svg`)
      .attr("width", width)
      .attr("height", dx)
      .attr("viewBox", [-margin.left, -margin.top, width, dx])
      .attr("style", "max-width: 100%; height: auto; font: 15px UFCsans; user-select: none;");

    const gLink = svg.append("g")
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 1.5);

    const gNode = svg.append("g")
      .attr("cursor", "pointer")
      .attr("pointer-events", "all");

    function update(event, source) {
      const duration = 50;
      const nodes = root.descendants().reverse();
      const links = root.links();

      treeLayout(root);

      let left = root, right = root;
      root.eachBefore(node => {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      const height = right.x - left.x + margin.top + margin.bottom;

      const transition = svg.transition()
        .duration(duration)
        .attr("height", height)
        .attr("viewBox", [-margin.left, left.x - margin.top, width, height]);

      const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

      const nodeEnter = node.enter().append("g")
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (event, d) => {
          d.children = d.children ? null : d._children;
          update(event, d);
        });

      nodeEnter.append("text")
        .attr("dy", "0.3em")
        .attr("x", 0)
        .attr("text-anchor", "start")
        .attr("opacity", d => d.data.opacity || 1)
        .text(d => d.data.name);

      nodeEnter.each(function (d) {
        const textEl = d3.select(this).select("text").node();
        const bbox = textEl.getBBox();
        d3.select(this).insert("rect", "text")
          .attr("x", bbox.x - 4)
          .attr("y", bbox.y - 2)
          .attr("width", bbox.width + 8)
          .attr("height", bbox.height + 4)
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("stroke-width", 0)
          .attr("fill-opacity", 1);
      });

      node.merge(nodeEnter).transition(transition)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      node.exit().transition(transition).remove()
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      const link = gLink.selectAll("path")
        .data(links, d => d.target.id);

      const linkEnter = link.enter().append("path")
        .attr("d", d => {
          const o = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o });
        })
        .attr("stroke-opacity", d => d.target.data.opacity || 1);

      link.merge(linkEnter).transition(transition)
        .attr("d", diagonal);

      link.exit().transition(transition).remove()
        .attr("d", d => {
          const o = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o });
        });

      root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
      });
    }

    root.x0 = dy / 2;
    root.y0 = 0;
    root.descendants().forEach((d, i) => {
      d.id = i;
      d._children = d.children;
      d.children = null;
    });

    update(null, root);
    expandTree({ root, update }, 50, tier);
  }).catch(error => {
    console.error("Failed to load JSON data:", error);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  ["strawweight", "lightweight", "middleweight", "heavyweight"].forEach(tier => {
    document.getElementById(`load-${tier}-tree`)?.addEventListener("click", () => {
      renderTree(tier);
    });
  });
});