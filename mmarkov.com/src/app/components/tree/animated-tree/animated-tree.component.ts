import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import * as d3 from 'd3';

interface TreeNode {
  name: string;
  tier?: string;
  children?: TreeNode[];
}

interface ProcessedNode {
  name: string;
  tier?: string;
  depth: number;
  hasChildren: boolean;
  isAvailable: boolean;
  isExpanded: boolean;
  path: string;
}

const TIERS = ['strawweight', 'lightweight', 'middleweight', 'heavyweight'] as const;
type Tier = typeof TIERS[number];

const TIER_INDEX: Record<Tier, number> = {
  strawweight: 0,
  lightweight: 1,
  middleweight: 2,
  heavyweight: 3,
};

// Layout constants
const NODE_SIZE = 20;
const MARGIN_LEFT = 20;
const MARGIN_TOP = 40;
const TIER_COLUMN_WIDTH = 110;
const NAME_COLUMN_WIDTH = 280;
const TRANSITION_DURATION = 400;

@Component({
  selector: 'app-animated-tree',
  standalone: true,
  templateUrl: './animated-tree.component.html',
  styleUrl: './animated-tree.component.css',
})
export class AnimatedTreeComponent implements AfterViewInit, OnChanges {
  @Input() jsonUrl = 'assets/tree.json';
  @Input() selectedTierIndex = 0;
  @Output() tierClick = new EventEmitter<number>();

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private ready = false;
  private cachedData: TreeNode[] | null = null;
  private manuallyCollapsed: Set<string> = new Set();
  private manuallyExpanded: Set<string> = new Set();

  // Keep track of SVG and groups for updates
  private svg: d3.Selection<SVGSVGElement, unknown, null, undefined> | null = null;
  private lineGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private nodeGroup: d3.Selection<SVGGElement, unknown, null, undefined> | null = null;
  private previousNodes: ProcessedNode[] = [];

  private get width(): number {
    return MARGIN_LEFT + NAME_COLUMN_WIDTH + (TIERS.length * TIER_COLUMN_WIDTH) + 20;
  }

  ngAfterViewInit(): void {
    this.ready = true;
    void this.loadAndRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;
    if (changes['jsonUrl']) {
      this.cachedData = null;
      this.svg = null; // Force full re-render
      void this.loadAndRender();
    } else if (changes['selectedTierIndex'] && this.cachedData) {
      this.updateTree(this.cachedData);
    }
  }

  private async loadAndRender(): Promise<void> {
    let data: TreeNode[] | undefined;
    try {
      data = await d3.json<TreeNode[]>(this.jsonUrl);
    } catch (e) {
      console.error('Failed to load tree data:', e);
      return;
    }

    if (!data) return;
    this.cachedData = data;
    this.initializeSvg(data);
    this.updateTree(data);
  }

  private initializeSvg(data: TreeNode[]): void {
    const container = this.containerRef.nativeElement;
    container.innerHTML = '';

    const nodes = this.processTree(data, this.selectedTierIndex);
    const height = (nodes.length + 1) * NODE_SIZE + MARGIN_TOP;

    // Create SVG
    this.svg = d3.select(container)
      .append('svg')
      .attr('width', this.width)
      .attr('height', height)
      .attr('viewBox', `0 0 ${this.width} ${height}`)
      .attr('style', 'max-width: 100%; height: auto; font: 14px "UFCSans", sans-serif;');

    // Draw static header
    this.drawHeader();

    // Create groups for lines and nodes
    this.lineGroup = this.svg.append('g')
      .attr('class', 'lines')
      .attr('fill', 'none')
      .attr('stroke-width', 1);

    this.nodeGroup = this.svg.append('g')
      .attr('class', 'nodes');
  }

  private drawHeader(): void {
    if (!this.svg) return;

    const headerY = 20;
    const headerHeight = MARGIN_TOP - 10;

    // Header background
    this.svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', this.width)
      .attr('height', headerHeight)
      .attr('fill', 'rgba(200, 200, 200, 0.2)');

    this.svg.append('text')
      .attr('x', MARGIN_LEFT + 10)
      .attr('y', headerY)
      .attr('font-weight', 'bold')
      .attr('fill', 'rgb(50, 50, 50)')
      .text('Description');

    // Tier column headers
    const headerGroup = this.svg.append('g').attr('class', 'tier-headers');

    TIERS.forEach((tier, i) => {
      const x = MARGIN_LEFT + NAME_COLUMN_WIDTH + (i * TIER_COLUMN_WIDTH) + TIER_COLUMN_WIDTH / 2;
      headerGroup.append('text')
        .attr('x', x)
        .attr('y', headerY)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('fill', i === this.selectedTierIndex ? 'rgb(30, 30, 30)' : 'rgb(100, 100, 100)')
        .attr('class', `tier-header-${i}`)
        .style('cursor', 'pointer')
        .text(tier.charAt(0).toUpperCase() + tier.slice(1))
        .on('click', () => {
          this.tierClick.emit(i);
        });
    });

    // Header separator
    this.svg.append('line')
      .attr('x1', 0)
      .attr('x2', this.width)
      .attr('y1', MARGIN_TOP - 10)
      .attr('y2', MARGIN_TOP - 10)
      .attr('stroke', 'rgb(200, 200, 200)');
  }

  private updateTree(data: TreeNode[]): void {
    if (!this.svg || !this.lineGroup || !this.nodeGroup) {
      this.initializeSvg(data);
      if (!this.svg || !this.lineGroup || !this.nodeGroup) return;
    }

    const nodes = this.processTree(data, this.selectedTierIndex);
    const previousNodeMap = new Map(this.previousNodes.map(n => [n.path, n]));
    const currentNodeMap = new Map(nodes.map((n, i) => [n.path, { node: n, index: i }]));

    // Update SVG height with transition
    const newHeight = (nodes.length + 1) * NODE_SIZE + MARGIN_TOP;
    this.svg
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('height', newHeight)
      .attr('viewBox', `0 0 ${this.width} ${newHeight}`);

    // Update tier header colors
    TIERS.forEach((_, i) => {
      this.svg!.select(`.tier-header-${i}`)
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('fill', i === this.selectedTierIndex ? 'rgb(30, 30, 30)' : 'rgb(100, 100, 100)');
    });

    // Update lines
    this.updateLines(nodes, previousNodeMap);

    // Update nodes
    this.updateNodes(nodes, previousNodeMap, currentNodeMap);

    this.previousNodes = nodes;
  }

  private updateLines(
    nodes: ProcessedNode[],
    previousNodeMap: Map<string, ProcessedNode>
  ): void {
    if (!this.lineGroup) return;

    // Build line data with unique keys
    interface LineData {
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      isAvailable: boolean;
      nodeIndex: number;
      parentIndex: number;
    }

    const lineData: LineData[] = [];

    nodes.forEach((node, i) => {
      if (node.depth === 0) return;

      const y = MARGIN_TOP + i * NODE_SIZE;
      const x = MARGIN_LEFT + node.depth * NODE_SIZE;
      const parentX = MARGIN_LEFT + (node.depth - 1) * NODE_SIZE;

      // Find parent
      let parentIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (nodes[j].depth === node.depth - 1) {
          parentIdx = j;
          break;
        }
      }

      if (parentIdx >= 0) {
        const parentY = MARGIN_TOP + parentIdx * NODE_SIZE;

        // Vertical line
        lineData.push({
          key: `v-${node.path}`,
          x1: parentX,
          y1: parentY,
          x2: parentX,
          y2: y,
          isAvailable: node.isAvailable,
          nodeIndex: i,
          parentIndex: parentIdx,
        });

        // Horizontal line
        lineData.push({
          key: `h-${node.path}`,
          x1: parentX,
          y1: y,
          x2: x,
          y2: y,
          isAvailable: node.isAvailable,
          nodeIndex: i,
          parentIndex: parentIdx,
        });
      }
    });

    // Data join for lines
    const lines = this.lineGroup
      .selectAll<SVGLineElement, LineData>('line')
      .data(lineData, d => d.key);

    // Exit: fade out removed lines
    lines.exit()
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('opacity', 0)
      .remove();

    // Enter: new lines start invisible and fade in
    const enterLines = lines.enter()
      .append('line')
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.key.startsWith('v-') ? d.x1 : d.x1) // Start collapsed for h-lines
      .attr('y2', d => d.key.startsWith('v-') ? d.y1 : d.y2) // Start collapsed for v-lines
      .attr('stroke', d => d.isAvailable ? 'rgb(80, 80, 80)' : 'rgb(200, 200, 200)')
      .attr('opacity', 0);

    // Transition entering lines
    enterLines
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
      .attr('opacity', 1);

    // Update: transition existing lines
    lines
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('x1', d => d.x1)
      .attr('y1', d => d.y1)
      .attr('x2', d => d.x2)
      .attr('y2', d => d.y2)
      .attr('stroke', d => d.isAvailable ? 'rgb(80, 80, 80)' : 'rgb(200, 200, 200)')
      .attr('opacity', 1);
  }

  private updateNodes(
    nodes: ProcessedNode[],
    previousNodeMap: Map<string, ProcessedNode>,
    currentNodeMap: Map<string, { node: ProcessedNode; index: number }>
  ): void {
    if (!this.nodeGroup) return;

    // Data join for node groups
    const nodeGroups = this.nodeGroup
      .selectAll<SVGGElement, ProcessedNode>('g.node')
      .data(nodes, d => d.path);

    // Exit: fade out and remove
    nodeGroups.exit()
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('opacity', 0)
      .remove();

    // Enter: create new node groups
    const enterGroups = nodeGroups.enter()
      .append('g')
      .attr('class', 'node')
      .attr('opacity', 0)
      .attr('transform', (d, i) => `translate(0,${MARGIN_TOP + i * NODE_SIZE})`);

    // Add circles to entering nodes
    enterGroups.append('circle')
      .attr('cx', d => MARGIN_LEFT + d.depth * NODE_SIZE)
      .attr('cy', 0)
      .attr('r', 3)
      .attr('fill', d => d.isAvailable ? 'rgb(80, 80, 80)' : 'rgb(200, 200, 200)')
      .style('cursor', d => d.hasChildren ? (d.isExpanded ? 'zoom-out' : 'zoom-in') : 'default')
      .on('click', (event, d) => {
        if (d.hasChildren) {
          event.stopPropagation();
          this.toggleNode(d.path, d.isExpanded);
        }
      });

    // Add text to entering nodes
    enterGroups.append('text')
      .attr('class', 'node-label')
      .attr('x', d => MARGIN_LEFT + d.depth * NODE_SIZE + 8)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .attr('fill', d => d.isAvailable ? 'rgb(80, 80, 80)' : 'rgb(200, 200, 200)')
      .style('cursor', d => d.hasChildren ? (d.isExpanded ? 'zoom-out' : 'zoom-in') : 'default')
      .text(d => d.name)
      .on('click', (event, d) => {
        if (d.hasChildren) {
          event.stopPropagation();
          this.toggleNode(d.path, d.isExpanded);
        }
      });

    // Add tier checkmarks to entering nodes
    enterGroups.each((d, i, elements) => {
      if (!d.tier) return;
      const g = d3.select(elements[i]);
      this.addTierCheckmarks(g, d);
    });

    // Fade in entering nodes
    enterGroups
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('opacity', 1);

    // Update: transition existing nodes
    const updateGroups = nodeGroups
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('opacity', 1)
      .attr('transform', (d, i) => `translate(0,${MARGIN_TOP + i * NODE_SIZE})`);

    // Update circles
    nodeGroups.select('circle')
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('fill', d => d.isAvailable ? 'rgb(80, 80, 80)' : 'rgb(200, 200, 200)');

    // Update cursor on circles (no transition needed)
    nodeGroups.select('circle')
      .style('cursor', d => d.hasChildren ? (d.isExpanded ? 'zoom-out' : 'zoom-in') : 'default');

    // Update text
    nodeGroups.select('text.node-label')
      .transition()
      .duration(TRANSITION_DURATION)
      .attr('fill', d => d.isAvailable ? 'rgb(80, 80, 80)' : 'rgb(200, 200, 200)');

    // Update cursor on text (no transition needed)
    nodeGroups.select('text.node-label')
      .style('cursor', d => d.hasChildren ? (d.isExpanded ? 'zoom-out' : 'zoom-in') : 'default');

    // Update tier checkmarks
    nodeGroups.each((d, i, elements) => {
      if (!d.tier) return;
      const g = d3.select(elements[i]);
      this.updateTierCheckmarks(g, d);
    });
  }

  private addTierCheckmarks(
    g: d3.Selection<SVGGElement, ProcessedNode, null, undefined>,
    d: ProcessedNode
  ): void {
    TIERS.forEach((tier, tierIdx) => {
      const x = MARGIN_LEFT + NAME_COLUMN_WIDTH + (tierIdx * TIER_COLUMN_WIDTH) + TIER_COLUMN_WIDTH / 2;
      const isIncluded = this.isTierIncluded(d.tier, tier);

      g.append('text')
        .attr('x', x)
        .attr('y', 0)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'middle')
        .attr('class', `material-symbols-outlined tier-check-${tierIdx}`)
        .style('font-size', '18px')
        .style('font-variation-settings', "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 18")
        .attr('fill', isIncluded ? 'rgb(100, 100, 100)' : 'rgb(220, 220, 220)')
        .text(isIncluded ? 'check_box' : 'disabled_by_default');
    });
  }

  private updateTierCheckmarks(
    g: d3.Selection<SVGGElement, ProcessedNode, SVGGElement, unknown>,
    d: ProcessedNode
  ): void {
    TIERS.forEach((tier, tierIdx) => {
      const isIncluded = this.isTierIncluded(d.tier, tier);
      g.select(`.tier-check-${tierIdx}`)
        .transition()
        .duration(TRANSITION_DURATION)
        .attr('fill', isIncluded ? 'rgb(100, 100, 100)' : 'rgb(220, 220, 220)')
        .text(isIncluded ? 'check_box' : 'disabled_by_default');
    });
  }

  private toggleNode(path: string, currentlyExpanded: boolean): void {
    if (currentlyExpanded) {
      this.manuallyCollapsed.add(path);
      this.manuallyExpanded.delete(path);
    } else {
      this.manuallyExpanded.add(path);
      this.manuallyCollapsed.delete(path);
    }
    if (this.cachedData) {
      this.updateTree(this.cachedData);
    }
  }

  private processTree(nodes: TreeNode[], tierIndex: number): ProcessedNode[] {
    const result: ProcessedNode[] = [];

    const process = (nodeList: TreeNode[], depth: number, parentPath: string) => {
      for (const node of nodeList) {
        const path = parentPath ? `${parentPath}/${node.name}` : node.name;
        const isAvailable = this.isNodeDirectlyAvailable(node, tierIndex);
        const hasAvailableDescendants = this.hasAvailableDescendants(node, tierIndex);
        const hasChildren = !!(node.children && node.children.length > 0);

        let isExpanded = hasAvailableDescendants;

        if (this.manuallyCollapsed.has(path)) {
          isExpanded = false;
        } else if (this.manuallyExpanded.has(path)) {
          isExpanded = true;
        }

        result.push({
          name: node.name,
          tier: node.tier,
          depth,
          hasChildren,
          isAvailable: isAvailable || hasAvailableDescendants,
          isExpanded,
          path,
        });

        if (hasChildren && isExpanded) {
          process(node.children!, depth + 1, path);
        }
      }
    };

    process(nodes, 0, '');
    return result;
  }

  private isNodeDirectlyAvailable(node: TreeNode, tierIndex: number): boolean {
    if (!node.tier) return false;
    const nodeTierIndex = TIER_INDEX[node.tier as Tier];
    return nodeTierIndex !== undefined && nodeTierIndex <= tierIndex;
  }

  private hasAvailableDescendants(node: TreeNode, tierIndex: number): boolean {
    if (!node.children) return false;

    for (const child of node.children) {
      if (this.isNodeDirectlyAvailable(child, tierIndex)) return true;
      if (this.hasAvailableDescendants(child, tierIndex)) return true;
    }

    return false;
  }

  private isTierIncluded(nodeTier: string | undefined, columnTier: Tier): boolean {
    if (!nodeTier) return false;
    const nodeIndex = TIER_INDEX[nodeTier as Tier];
    const columnIndex = TIER_INDEX[columnTier];
    if (nodeIndex === undefined) return false;
    return columnIndex >= nodeIndex;
  }
}
