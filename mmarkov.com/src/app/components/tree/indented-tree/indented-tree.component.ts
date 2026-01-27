import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
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
  path: string; // Unique path identifier for tracking collapsed state
}

const TIERS = ['strawweight', 'lightweight', 'middleweight', 'heavyweight'] as const;
type Tier = typeof TIERS[number];

const TIER_INDEX: Record<Tier, number> = {
  strawweight: 0,
  lightweight: 1,
  middleweight: 2,
  heavyweight: 3,
};

@Component({
  selector: 'app-indented-tree',
  standalone: true,
  templateUrl: './indented-tree.component.html',
  styleUrl: './indented-tree.component.css',
})
export class IndentedTreeComponent implements AfterViewInit, OnChanges {
  @Input() jsonUrl = 'assets/tree.json';
  @Input() selectedTierIndex = 0;

  @ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private ready = false;
  private cachedData: TreeNode[] | null = null;
  private manuallyCollapsed: Set<string> = new Set();
  private manuallyExpanded: Set<string> = new Set();

  ngAfterViewInit(): void {
    this.ready = true;
    void this.loadAndRender();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;
    if (changes['jsonUrl']) {
      this.cachedData = null;
      void this.loadAndRender();
    } else if (changes['selectedTierIndex'] && this.cachedData) {
      this.render(this.cachedData);
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
    this.render(data);
  }

  private render(data: TreeNode[]): void {
    const container = this.containerRef.nativeElement;
    container.innerHTML = '';

    // Process tree: flatten while respecting expansion state
    const nodes = this.processTree(data, this.selectedTierIndex);

    if (nodes.length === 0) return;

    // Dimensions
    const nodeSize = 20;
    const marginLeft = 20;
    const marginTop = 40;
    const tierColumnWidth = 110;
    const nameColumnWidth = 280;
    const width = marginLeft + nameColumnWidth + (TIERS.length * tierColumnWidth) + 20;
    const height = (nodes.length + 1) * nodeSize + marginTop;

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height])
      .attr('style', 'max-width: 100%; height: auto; font: 14px "UFCSans", sans-serif;');

    // Column headers
    const headerY = 20;
    const headerHeight = marginTop - 10;

    // Header background
    svg.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width)
      .attr('height', headerHeight)
      .attr('fill', 'rgba(200, 200, 200, 0.2)');

    svg.append('text')
      .attr('x', marginLeft + 10)
      .attr('y', headerY)
      .attr('font-weight', 'bold')
      .attr('fill', 'rgb(50, 50, 50)')
      .text('Description');

    TIERS.forEach((tier, i) => {
      const x = marginLeft + nameColumnWidth + (i * tierColumnWidth) + tierColumnWidth / 2;
      svg.append('text')
        .attr('x', x)
        .attr('y', headerY)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .attr('fill', i === this.selectedTierIndex ? 'rgb(30, 30, 30)' : 'rgb(100, 100, 100)')
        .text(tier.charAt(0).toUpperCase() + tier.slice(1));
    });

    // Header separator
    svg.append('line')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', marginTop - 10)
      .attr('y2', marginTop - 10)
      .attr('stroke', 'rgb(200, 200, 200)');

    // Draw connecting lines
    const lineGroup = svg.append('g')
      .attr('fill', 'none')
      .attr('stroke-width', 1);

    // For each node, find its parent and draw connecting lines
    nodes.forEach((node, i) => {
      if (node.depth === 0) return;

      const y = marginTop + i * nodeSize;
      const x = marginLeft + node.depth * nodeSize;
      const parentX = marginLeft + (node.depth - 1) * nodeSize;
      const strokeColor = node.isAvailable ? 'rgb(150, 150, 150)' : 'rgb(220, 220, 220)';

      // Find the parent node (last node with depth = current depth - 1)
      let parentIdx = -1;
      for (let j = i - 1; j >= 0; j--) {
        if (nodes[j].depth === node.depth - 1) {
          parentIdx = j;
          break;
        }
      }

      if (parentIdx >= 0) {
        const parentY = marginTop + parentIdx * nodeSize;

        // Vertical line from parent down to this node's level
        lineGroup.append('line')
          .attr('x1', parentX)
          .attr('x2', parentX)
          .attr('y1', parentY)
          .attr('y2', y)
          .attr('stroke', strokeColor);

        // Horizontal line to the node
        lineGroup.append('line')
          .attr('x1', parentX)
          .attr('x2', x)
          .attr('y1', y)
          .attr('y2', y)
          .attr('stroke', strokeColor);
      }
    });

    // Nodes
    const nodeGroup = svg.append('g')
      .selectAll('g')
      .data(nodes)
      .join('g')
      .attr('transform', (d, i) => `translate(0,${marginTop + i * nodeSize})`);

    // Node circles
    nodeGroup.append('circle')
      .attr('cx', d => marginLeft + d.depth * nodeSize)
      .attr('cy', 0)
      .attr('r', 3)
      .attr('fill', d => {
        if (!d.isAvailable) return 'rgb(210, 210, 210)';
        return d.hasChildren ? 'rgb(80, 80, 80)' : 'rgb(150, 150, 150)';
      })
      .style('cursor', d => d.hasChildren ? 'pointer' : 'default')
      .on('click', (event, d) => {
        if (d.hasChildren) {
          event.stopPropagation();
          this.toggleNode(d.path, d.isExpanded);
        }
      });

    // Node text
    nodeGroup.append('text')
      .attr('x', d => marginLeft + d.depth * nodeSize + 8)
      .attr('y', 0)
      .attr('dy', '0.35em')
      .attr('fill', d => d.isAvailable ? 'rgb(50, 50, 50)' : 'rgb(180, 180, 180)')
      .style('cursor', d => d.hasChildren ? 'pointer' : 'default')
      .text(d => d.name)
      .on('click', (event, d) => {
        if (d.hasChildren) {
          event.stopPropagation();
          this.toggleNode(d.path, d.isExpanded);
        }
      });

    // Tier checkmarks (only for nodes with a tier property)
    nodeGroup.each((d, i, nodeElements) => {
      if (!d.tier) return; // Skip nodes without a tier

      const g = d3.select(nodeElements[i]);

      TIERS.forEach((tier, tierIdx) => {
        const x = marginLeft + nameColumnWidth + (tierIdx * tierColumnWidth) + tierColumnWidth / 2;
        const isIncluded = this.isTierIncluded(d.tier, tier);

        g.append('text')
          .attr('x', x)
          .attr('y', 0)
          .attr('dy', '0.35em')
          .attr('text-anchor', 'middle')
          .attr('class', 'material-symbols-outlined')
          .style('font-size', '18px')
          .style('font-variation-settings', "'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 18")
          .attr('fill', isIncluded ? 'rgb(100, 100, 100)' : 'rgb(220, 220, 220)')
          .text(isIncluded ? 'check_box' : 'disabled_by_default');
      });
    });
  }

  /**
   * Toggle the expanded/collapsed state of a node
   */
  private toggleNode(path: string, currentlyExpanded: boolean): void {
    if (currentlyExpanded) {
      this.manuallyCollapsed.add(path);
      this.manuallyExpanded.delete(path);
    } else {
      this.manuallyExpanded.add(path);
      this.manuallyCollapsed.delete(path);
    }
    if (this.cachedData) {
      this.render(this.cachedData);
    }
  }

  /**
   * Process tree into flat list, only expanding nodes that have available descendants
   */
  private processTree(nodes: TreeNode[], tierIndex: number): ProcessedNode[] {
    const result: ProcessedNode[] = [];

    const process = (nodeList: TreeNode[], depth: number, parentPath: string) => {
      for (const node of nodeList) {
        const path = parentPath ? `${parentPath}/${node.name}` : node.name;
        const isAvailable = this.isNodeDirectlyAvailable(node, tierIndex);
        const hasAvailableDescendants = this.hasAvailableDescendants(node, tierIndex);
        const hasChildren = !!(node.children && node.children.length > 0);

        // Default expansion based on tier availability
        let isExpanded = hasAvailableDescendants;

        // Override with manual state if set
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

        // Only recurse into children if this node should be expanded
        if (hasChildren && isExpanded) {
          process(node.children!, depth + 1, path);
        }
      }
    };

    process(nodes, 0, '');
    return result;
  }

  /**
   * Check if a node itself is available (not considering descendants)
   */
  private isNodeDirectlyAvailable(node: TreeNode, tierIndex: number): boolean {
    if (!node.tier) return false;
    const nodeTierIndex = TIER_INDEX[node.tier as Tier];
    return nodeTierIndex !== undefined && nodeTierIndex <= tierIndex;
  }

  /**
   * Check if any descendant of this node is available
   */
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
