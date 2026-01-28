import * as d3 from 'd3';
import { polarToCartesian } from '../../../utils/coordinates-convert';
import { NodeDto, EdgeDto } from '../../../models/network/graph.dto';

type XY = { x: number; y: number };

export type GraphChartCallbacks = {
  onActiveNodeIds: (ids: number[]) => void;
};

export type GraphChartConfig = {
  width: number;
  height: number;
  padding: number;
  labelR: number; // data-space radius for label placement
};

export type GraphChartInstance = {
  update: (nodes: NodeDto[], edges: EdgeDto[]) => void;
  destroy: () => void;
};

export function createGraphChart(
  svgEl: SVGSVGElement,
  callbacks: GraphChartCallbacks,
  config: GraphChartConfig
): GraphChartInstance {
  // -------------------------
  // Persistent state (kept across updates)
  // -------------------------
  const originPos = new Map<number, XY>(); // fighterId -> original pixel position
  const pos = new Map<number, XY>();       // fighterId -> current pixel position
  const activeIds = new Set<number>();     // active nodes (ids)

  // Emit current active ids as a plain array (stable contract)
  const emitActiveIds = () => {
    callbacks.onActiveNodeIds(Array.from(activeIds));
  };

  // -------------------------
  // Helpers: label anchor + offsets (values unchanged)
  // -------------------------
  function labelAnchor(theta: number): { anchor: 'start' | 'end' | 'middle'; dx: number; dy: number } {
    const TWO_PI = 2 * Math.PI;
    const t = ((theta % TWO_PI) + TWO_PI) % TWO_PI;

    const center1 = t >= (70 * Math.PI) / 180 && t <= (110 * Math.PI) / 180;
    const center2 = t >= (250 * Math.PI) / 180 && t <= (290 * Math.PI) / 180;

    const up = Math.PI / 2;
    const down = (3 * Math.PI) / 2;

    const distToUp = Math.abs(t - up);
    const distToDown = Math.abs(t - down);
    const dist = Math.min(distToUp, distToDown);

    const BASE = 5;
    const EXTRA = 15;
    const WIDTH = Math.PI / 6;

    const strength = Math.max(0, 1 - dist / WIDTH);

    const OUT = 5;
    const dy = (Math.sin(t) >= 0 ? -1 : 1) * (BASE + EXTRA * strength);

    if (center1 || center2) {
      return { anchor: 'middle', dx: 0, dy };
    }

    const anchor: 'start' | 'end' = Math.cos(t) >= 0 ? 'start' : 'end';
    const dx = anchor === 'start' ? OUT : -OUT;

    return { anchor, dx, dy };
  }

  function baseX(d: NodeDto, xScale: d3.ScaleLinear<number, number>, labelR: number): number {
    const target = polarToCartesian(labelR, d.pos.theta);
    const dxData = target.x - d.pos.x;
    return xScale(d.pos.x + dxData) - xScale(d.pos.x);
  }

  function baseY(d: NodeDto, yScale: d3.ScaleLinear<number, number>, labelR: number): number {
    const target = polarToCartesian(labelR, d.pos.theta);
    const dyData = target.y - d.pos.y;
    return yScale(d.pos.y + dyData) - yScale(d.pos.y);
  }

  // -------------------------
  // Render (rebuilds SVG each update; state persists via maps/sets)
  // -------------------------
  function render(nodes: NodeDto[], edges: EdgeDto[]) {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${config.width} ${config.height}`)
      .attr('width', config.width)
      .attr('height', config.height);

    const root = svg.append('g').attr('class', 'chart-root');

    // --- scales ---
    const xs = nodes.map((n) => n.pos.x);
    const ys = nodes.map((n) => n.pos.y);

    let xExtent = d3.extent(xs) as [number, number];
    let yExtent = d3.extent(ys) as [number, number];

    if (xExtent[0] === xExtent[1]) xExtent = [xExtent[0] - 1, xExtent[1] + 1];
    if (yExtent[0] === yExtent[1]) yExtent = [yExtent[0] - 1, yExtent[1] + 1];

    const xScale = d3.scaleLinear().domain(xExtent).range([config.padding, config.width - config.padding]);
    const yScale = d3.scaleLinear().domain(yExtent).range([config.height - config.padding, config.padding]);

    // --- init/keep pixel positions ---
    const getX = (n: NodeDto) => xScale(n.pos.x);
    const getY = (n: NodeDto) => yScale(n.pos.y);

    for (const n of nodes) {
      const id = n.fighter.fighterId;
      const xy = { x: getX(n), y: getY(n) };

      if (!originPos.has(id)) originPos.set(id, xy);
      if (!pos.has(id)) pos.set(id, xy);
    }

    const getPX = (id: number) => pos.get(id)!.x;
    const getPY = (id: number) => pos.get(id)!.y;

    // --- edge thickness scale ---
    const wExtent = d3.extent(edges.map((e) => e.weight)) as [number, number];
    const wDomain: [number, number] =
      wExtent[0] === wExtent[1] ? [wExtent[0] - 1, wExtent[1] + 1] : wExtent;

    const edgeWeight = d3.scaleLinear().domain(wDomain).range([1, 6]).clamp(true);

    // --- edges (no filtering) ---
    const edgesSelection = root
      .append('g')
      .attr('class', 'edges')
      .selectAll<SVGLineElement, EdgeDto>('line')
      .data(edges)
      .join('line')
      .attr('x1', (e) => getPX(e.source))
      .attr('y1', (e) => getPY(e.source))
      .attr('x2', (e) => getPX(e.target))
      .attr('y2', (e) => getPY(e.target))
      .attr('stroke', 'gray')
      .attr('stroke-opacity', 0.1)
      .attr('stroke-width', (e) => edgeWeight(e.weight))
      .attr('class', 'edge');

    const updateEdges = () => {
      edgesSelection
        .attr('x1', (e) => getPX(e.source))
        .attr('y1', (e) => getPY(e.source))
        .attr('x2', (e) => getPX(e.target))
        .attr('y2', (e) => getPY(e.target));
    };

    // --- nodes ---
    const nodeG = root
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, NodeDto>('g.node')
      .data(nodes, (d: any) => d.fighter.fighterId)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

    nodeG
      .append('circle')
      .attr('r', 5)
      .attr('fill', (d) => (d.color == null ? 'gray' : String(d.color)))
      .attr('class', 'node-circle');

    // labels (anchor computed once per label)
    nodeG
      .append('text')
      .attr('class', 'node-label')
      .attr('dominant-baseline', 'middle')
      .each((d, i, els) => {
        const a = labelAnchor(d.pos.theta);
        const x = baseX(d, xScale, config.labelR) + a.dx;
        const y = baseY(d, yScale, config.labelR) + a.dy;

        d3.select(els[i]).attr('text-anchor', a.anchor).attr('x', x).attr('y', y);
      })
      .text((d) => `${d.fighter.lastName ?? ''}`);

    // --- active styles (nodes + edges) ---
    const applyActiveStyles = () => {
      nodeG.classed('active', (d) => activeIds.has(d.fighter.fighterId));

      edgesSelection.attr('stroke-opacity', (e) => {
        if (activeIds.size === 0) return 0.1;
        return activeIds.has(e.source) || activeIds.has(e.target) ? 1 : 0.1;
      });
    };

    const toggleActive = (id: number) => {
      if (activeIds.has(id)) activeIds.delete(id);
      else activeIds.add(id);

      applyActiveStyles();
      emitActiveIds();
    };

    const addActive = (id: number) => {
      if (!activeIds.has(id)) {
        activeIds.add(id);
        applyActiveStyles();
        emitActiveIds();
      }
    };

    const clearActive = () => {
      if (activeIds.size === 0) return;
      activeIds.clear();
      applyActiveStyles();
      emitActiveIds();
    };

    // click toggles active
    nodeG.on('click', (event, d) => {
      event.stopPropagation();
      toggleActive(d.fighter.fighterId);
    });

    // drag updates pos + edges; also ensures dragged node becomes active
    const dragBehavior = d3
      .drag<SVGGElement, NodeDto>()
      .on('drag', function (event, d) {
        const id = d.fighter.fighterId;

        pos.set(id, { x: event.x, y: event.y });
        d3.select(this).attr('transform', `translate(${event.x}, ${event.y})`);

        addActive(id);
        updateEdges();
      });

    nodeG.call(dragBehavior as any);

    // reset positions (background click)
    const resetToOriginalPositions = () => {
      for (const [id, xy] of originPos.entries()) {
        pos.set(id, { x: xy.x, y: xy.y });
      }

      nodeG
        .transition()
        .duration(500)
        .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

      edgesSelection
        .transition()
        .duration(350)
        .attr('x1', (e) => getPX(e.source))
        .attr('y1', (e) => getPY(e.source))
        .attr('x2', (e) => getPX(e.target))
        .attr('y2', (e) => getPY(e.target));

      clearActive();
    };

    // background click clears active + resets positions
    svg.on('click', () => {
      resetToOriginalPositions();
    });

    // initial render style + initial emit (so table can start with “no filter”)
    applyActiveStyles();
    emitActiveIds();
  }

  // -------------------------
  // Public API
  // -------------------------
  return {
    update(nodes: NodeDto[], edges: EdgeDto[]) {
      render(nodes, edges);
    },
    destroy() {
      const svg = d3.select(svgEl);
      svg.on('.drag', null);
      svg.on('click', null);
      svg.selectAll('*').remove();
    },
  };
}
