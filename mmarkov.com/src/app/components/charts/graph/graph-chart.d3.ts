import * as d3 from 'd3';
import { NodeDto, EdgeDto } from '../../../models/network/graph.dto';

type XY = { x: number; y: number };

export type GraphChartCallbacks = {
  onActiveNodeId: (id: number | null) => void;
};

export type GraphChartConfig = {
  width: number;
  height: number;
  padding: number;
};

export type PosType = 'circular' | 'spring';

export type GraphChartInstance = {
  update: (nodes: NodeDto[], edges: EdgeDto[], pos: PosType) => void;
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
  let activeId: number | null = null;      // active node (single)

  // Track current state for transitions
  let currentPosType: PosType | null = null;
  let currentNodes: NodeDto[] = [];
  let currentEdges: EdgeDto[] = [];
  let nodeSelection: d3.Selection<SVGGElement, NodeDto, SVGGElement, unknown> | null = null;
  let edgeSelection: d3.Selection<SVGLineElement, EdgeDto, SVGGElement, unknown> | null = null;

  // Emit current active id
  const emitActiveId = () => {
    callbacks.onActiveNodeId(activeId);
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

    const EXTRA = 15;
    const WIDTH = Math.PI / 4;

    const strength = Math.max(0, 1 - dist / WIDTH);

    const dy = (Math.sin(t) >= 0 ? 1 : -1) * (EXTRA * strength);

    if (center1 || center2) {
      return { anchor: 'middle', dx: 0, dy };
    }

    const anchor: 'start' | 'end' = Math.cos(t) >= 0 ? 'start' : 'end';

    return { anchor, dx: 0, dy };
  }

  function baseX(d: NodeDto, labelOffset: number): number {
    return labelOffset * Math.cos(d.pos.theta);
  }

  function baseY(d: NodeDto, labelOffset: number): number {
    return labelOffset * Math.sin(d.pos.theta);
  }

  // --- center point for circular layout ---
  const centerX = config.width / 2;
  const centerY = config.height / 2;
  const circularRadius = Math.min(config.width, config.height) / 2 - config.padding - 40;

  // Position getter factory based on layout type
  function createPositionGetters(nodes: NodeDto[], posType: PosType) {
    // Fixed coordinate system [-1, 1] centered at (0, 0)
    const xScale = d3.scaleLinear().domain([-1, 1]).range([config.padding, config.width - config.padding]);
    const yScale = d3.scaleLinear().domain([-1, 1]).range([config.height - config.padding, config.padding]);

    const getX = (n: NodeDto) => {
      if (posType === 'circular') {
        return centerX + circularRadius * Math.cos(n.pos.theta);
      }
      return xScale(n.pos.x);
    };
    const getY = (n: NodeDto) => {
      if (posType === 'circular') {
        return centerY + circularRadius * Math.sin(n.pos.theta);
      }
      return yScale(n.pos.y);
    };

    return { getX, getY };
  }

  // Transition to new layout positions
  function transitionToLayout(posType: PosType, duration: number = 1000) {
    if (!nodeSelection || !edgeSelection || currentNodes.length === 0) return;

    const { getX, getY } = createPositionGetters(currentNodes, posType);

    // Update position maps
    originPos.clear();
    pos.clear();
    for (const n of currentNodes) {
      const id = n.fighter.fighterId;
      const xy = { x: getX(n), y: getY(n) };
      originPos.set(id, xy);
      pos.set(id, xy);
    }

    const getPX = (id: number) => pos.get(id)!.x;
    const getPY = (id: number) => pos.get(id)!.y;

    // Animate nodes
    nodeSelection
      .transition()
      .duration(duration)
      .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

    // Animate edges
    edgeSelection
      .transition()
      .duration(duration)
      .attr('x1', (e) => getPX(e.source))
      .attr('y1', (e) => getPY(e.source))
      .attr('x2', (e) => getPX(e.target))
      .attr('y2', (e) => getPY(e.target));

    currentPosType = posType;
  }

  // -------------------------
  // Render (rebuilds SVG each update; state persists via maps/sets)
  // -------------------------
  function render(nodes: NodeDto[], edges: EdgeDto[], posType: PosType) {
    const svg = d3.select(svgEl);
    svg.selectAll('*').remove();

    svg
      .attr('viewBox', `0 0 ${config.width} ${config.height}`)
      .attr('width', config.width)
      .attr('height', config.height);

    const root = svg.append('g').attr('class', 'chart-root');

    // Store current state
    currentNodes = nodes;
    currentEdges = edges;
    currentPosType = posType;

    const { getX, getY } = createPositionGetters(nodes, posType);

    // Clear and reset positions for new layout
    originPos.clear();
    pos.clear();

    for (const n of nodes) {
      const id = n.fighter.fighterId;
      const xy = { x: getX(n), y: getY(n) };

      originPos.set(id, xy);
      pos.set(id, xy);
    }

    const getPX = (id: number) => pos.get(id)!.x;
    const getPY = (id: number) => pos.get(id)!.y;

    // --- edge thickness scale ---
    const wExtent = d3.extent(edges.map((e) => e.weight)) as [number, number];
    const wDomain: [number, number] =
      wExtent[0] === wExtent[1] ? [wExtent[0] - 1, wExtent[1] + 1] : wExtent;

    const edgeWeight = d3.scaleLinear().domain(wDomain).range([1, 6]).clamp(true);

    // --- edges (no filtering) ---
    edgeSelection = root
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
      edgeSelection!
        .attr('x1', (e) => getPX(e.source))
        .attr('y1', (e) => getPY(e.source))
        .attr('x2', (e) => getPX(e.target))
        .attr('y2', (e) => getPY(e.target));
    };

    // --- nodes ---
    nodeSelection = root
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, NodeDto>('g.node')
      .data(nodes, (d: any) => d.fighter.fighterId)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

    nodeSelection
      .append('circle')
      .attr('r', 5)
      .attr('fill', (d) => (d.color == null ? 'gray' : String(d.color)))
      .attr('class', 'node-circle');

    // labels (anchor computed once per label)
    const labelOffset = 15; // pixel offset for circular layout
    nodeSelection
      .append('text')
      .attr('class', 'node-label')
      .attr('dominant-baseline', 'middle')
      .each((d, i, els) => {
        const a = labelAnchor(d.pos.theta);
        const x = baseX(d, labelOffset) + a.dx;
        const y = baseY(d, labelOffset) + a.dy;

        d3.select(els[i]).attr('text-anchor', a.anchor).attr('x', x).attr('y', y);
      })
      .text((d) => `${d.fighter.lastName ?? ''}`);

    // --- active styles (nodes + edges) ---
    const applyActiveStyles = () => {
      nodeSelection!.classed('active', (d) => d.fighter.fighterId === activeId);

      edgeSelection!.attr('stroke-opacity', (e) => {
        if (activeId === null) return 0.1;
        return e.source === activeId || e.target === activeId ? 1 : 0.1;
      });
    };

    const toggleActive = (id: number) => {
      activeId = activeId === id ? null : id;
      applyActiveStyles();
      emitActiveId();
    };

    const setActive = (id: number) => {
      if (activeId !== id) {
        activeId = id;
        applyActiveStyles();
        emitActiveId();
      }
    };

    const clearActive = () => {
      if (activeId === null) return;
      activeId = null;
      applyActiveStyles();
      emitActiveId();
    };

    // click toggles active
    nodeSelection!.on('click', (event, d) => {
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

        setActive(id);
        updateEdges();
      });

    nodeSelection!.call(dragBehavior as any);

    // reset positions (background click)
    const resetToOriginalPositions = () => {
      for (const [id, xy] of originPos.entries()) {
        pos.set(id, { x: xy.x, y: xy.y });
      }

      nodeSelection!
        .transition()
        .duration(500)
        .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

      edgeSelection!
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

    // initial render style + initial emit (so table can start with "no filter")
    applyActiveStyles();
    emitActiveId();
  }

  // -------------------------
  // Public API
  // -------------------------
  return {
    update(nodes: NodeDto[], edges: EdgeDto[], posType: PosType = 'circular') {
      // Check if only position type changed (same data)
      const sameData =
        currentNodes.length === nodes.length &&
        currentEdges.length === edges.length &&
        currentNodes.every((n, i) => n.fighter.fighterId === nodes[i]?.fighter.fighterId);

      if (sameData && currentPosType !== null && currentPosType !== posType) {
        // Only position type changed - animate transition
        transitionToLayout(posType);
      } else {
        // Data changed or first render - full rebuild
        render(nodes, edges, posType);
      }
    },
    destroy() {
      const svg = d3.select(svgEl);
      svg.on('.drag', null);
      svg.on('click', null);
      svg.selectAll('*').remove();
    },
  };
}
