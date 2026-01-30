import * as d3 from 'd3';
import { NodeDto, EdgeDto } from '../../../models/network/graph.dto';

type XY = { x: number; y: number };

// Color palette for groups
const clusterColors = [
  '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
  '#ffff33', '#a65628', '#f781bf', '#999999', '#66c2a5'
];

export type GraphChartCallbacks = {
  onActiveNodeId: (id: number | null) => void;
};

export type GraphChartConfig = {
  width: number;
  height: number;
  padding: number;
};

export type PosType = 'circular' | 'cluster';

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

  // Track hit areas for layout transitions
  let hitAreaSelection: d3.Selection<SVGCircleElement, NodeDto, SVGGElement, unknown> | null = null;

  // Track voronoi cells for cluster layout
  let voronoiSelection: d3.Selection<SVGPathElement, NodeDto, SVGGElement, unknown> | null = null;

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

    // Animate nodes with smooth easing
    nodeSelection
      .transition()
      .duration(duration)
      .ease(d3.easeCubicInOut)
      .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

    // Animate edges with smooth easing
    edgeSelection
      .transition()
      .duration(duration)
      .ease(d3.easeCubicInOut)
      .attr('x1', (e) => getPX(e.source))
      .attr('y1', (e) => getPY(e.source))
      .attr('x2', (e) => getPX(e.target))
      .attr('y2', (e) => getPY(e.target));

    // Animate hit areas with smooth easing
    if (hitAreaSelection) {
      hitAreaSelection
        .transition()
        .duration(duration)
        .ease(d3.easeCubicInOut)
        .attr('cx', (d) => getPX(d.fighter.fighterId))
        .attr('cy', (d) => getPY(d.fighter.fighterId));
    }

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

    const edgeWeight = d3.scaleLinear().domain(wDomain).range([1, 3]).clamp(true);

    // --- Voronoi diagram for cluster layout ---
    if (posType === 'cluster' && nodes.length >= 3) {
      const points = nodes.map(n => [getPX(n.fighter.fighterId), getPY(n.fighter.fighterId)] as [number, number]);
      const delaunay = d3.Delaunay.from(points);
      const voronoi = delaunay.voronoi([0, 0, config.width, config.height]);

      voronoiSelection = root
        .append('g')
        .attr('class', 'voronoi')
        .selectAll<SVGPathElement, NodeDto>('path')
        .data(nodes)
        .join('path')
        .attr('d', (d, i) => voronoi.renderCell(i))
        .attr('fill', (d) => clusterColors[d.cluster % clusterColors.length])
        .attr('fill-opacity', 0.15)
        .attr('stroke', (d) => clusterColors[d.cluster % clusterColors.length])
        .attr('stroke-opacity', 0.3)
        .attr('stroke-width', 1);
    } else {
      voronoiSelection = null;
    }

    // --- edges ---
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
      .attr('stroke', '#c0c0c0')
      .attr('stroke-opacity', 1)
      .attr('stroke-width', (e) => edgeWeight(e.weight))
      .attr('class', 'edge');

    // --- nodes ---
    nodeSelection = root
      .append('g')
      .attr('class', 'nodes')
      .selectAll<SVGGElement, NodeDto>('g.node')
      .data(nodes, (d: any) => d.fighter.fighterId)
      .join('g')
      .attr('class', 'node')
      .attr('transform', (d) => `translate(${getPX(d.fighter.fighterId)}, ${getPY(d.fighter.fighterId)})`);

    // Color nodes: by corner in circular mode, by group in cluster mode
    const getNodeColor = (d: NodeDto) => {
      if (posType === 'cluster') {
        return clusterColors[d.cluster % clusterColors.length];
      }
      return d.color == null ? 'gray' : String(d.color);
    };

    nodeSelection
      .append('circle')
      .attr('r', 5)
      .attr('fill', getNodeColor)
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
        if (activeId === null) return 1;
        return e.source === activeId || e.target === activeId ? 1 : 0;
      });
    };

    // Create invisible hit areas that move with layout transitions (for hover detection)
    hitAreaSelection = root
      .append('g')
      .attr('class', 'hit-areas')
      .selectAll<SVGCircleElement, NodeDto>('circle')
      .data(nodes, (d: any) => d.fighter.fighterId)
      .join('circle')
      .attr('cx', (d) => originPos.get(d.fighter.fighterId)!.x)
      .attr('cy', (d) => originPos.get(d.fighter.fighterId)!.y)
      .attr('r', 20)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer');

    const activateNode = (id: number) => {
      // Only activate in circular mode
      if (currentPosType !== 'circular') return;
      if (activeId === id) return;

      activeId = id;
      nodeSelection!.classed('active', (n) => n.fighter.fighterId === id);

      // Move to center
      pos.set(id, { x: centerX, y: centerY });

      nodeSelection!
        .filter((n) => n.fighter.fighterId === id)
        .transition()
        .duration(1000)
        .attr('transform', `translate(${centerX}, ${centerY})`);

      // Move edges and hide non-connected
      edgeSelection!
        .transition()
        .duration(1000)
        .attr('x1', (e) => getPX(e.source))
        .attr('y1', (e) => getPY(e.source))
        .attr('x2', (e) => getPX(e.target))
        .attr('y2', (e) => getPY(e.target))
        .attr('stroke-opacity', (e) =>
          e.source === id || e.target === id ? 1 : 0
        );

      emitActiveId();
    };

    const deactivateNode = () => {
      if (activeId === null) return;

      const id = activeId;
      activeId = null;
      nodeSelection!.classed('active', false);

      // Return to original position
      const original = originPos.get(id)!;
      pos.set(id, { x: original.x, y: original.y });

      nodeSelection!
        .filter((n) => n.fighter.fighterId === id)
        .transition()
        .duration(1000)
        .attr('transform', `translate(${original.x}, ${original.y})`);

      // Reset edges
      edgeSelection!
        .transition()
        .duration(1000)
        .attr('x1', (e) => originPos.get(e.source)!.x)
        .attr('y1', (e) => originPos.get(e.source)!.y)
        .attr('x2', (e) => originPos.get(e.target)!.x)
        .attr('y2', (e) => originPos.get(e.target)!.y)
        .attr('stroke-opacity', 1);

      emitActiveId();
    };

    // Hover on invisible hit areas (only in circular mode)
    hitAreaSelection
      .on('mouseenter', (event, d) => {
        activateNode(d.fighter.fighterId);
      })
      .on('mouseleave', () => {
        deactivateNode();
      });

    // background click deactivates node
    svg.on('click', () => {
      deactivateNode();
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

      // Always re-render when switching layout types (circular <-> cluster)
      // because visual elements differ (Voronoi cells, node colors)
      if (sameData && currentPosType !== null && currentPosType !== posType) {
        // Full re-render for layout type change
        render(nodes, edges, posType);
      } else if (!sameData || currentPosType === null) {
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
