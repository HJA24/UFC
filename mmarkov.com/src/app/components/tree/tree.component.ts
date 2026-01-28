import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
} from "@angular/core";
import * as d3 from "d3";

type TreeDatum = {
  name: string;
  opacity?: number;
  expanded?: boolean;
  children?: TreeDatum[];
};

type ExtendedNode = d3.HierarchyNode<TreeDatum> & {
  id: number;
  x0: number;
  y0: number;
  _children: ExtendedNode[] | null;
  children: ExtendedNode[] | null;
};

type XY = { x: number; y: number };

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function curveFlowchart(alpha = 0.75) {
  return (context: CanvasRenderingContext2D) => {
    let x0 = 0,
      y0 = 0;
    let first = true;

    return {
      lineStart() {
        first = true;
      },
      lineEnd() {},
      point(x1: number, y1: number) {
        if (first) {
          context.moveTo(x1, y1);
          first = false;
        } else {
          const xMid = x0 + alpha * (x1 - x0);
          context.lineTo(xMid, y0);
          context.lineTo(xMid, y1);
          context.lineTo(x1, y1);
        }
        x0 = x1;
        y0 = y1;
      },
    };
  };
}

@Component({
  selector: "app-tree",
  standalone: true,
  templateUrl: "./tree.component.html",
  styleUrls: ["./tree.component.css"],
})
export class TreeComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() tier?: string;
  @Input() jsonUrl?: string;

  /** Optional: control expansion animation */
  @Input() expandDelay = 50;

  @ViewChild("svg", { static: true }) svgRef!: ElementRef<SVGSVGElement>;
  @ViewChild("container", { static: true }) containerRef!: ElementRef<HTMLDivElement>;

  private destroyed = false;
  private ready = false;

  // prevents out-of-order async loads from rendering after a newer one
  private renderToken = 0;

  ngAfterViewInit(): void {
    this.ready = true;
    void this.renderIfPossible();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.ready) return;
    if (changes["tier"] || changes["jsonUrl"]) void this.renderIfPossible();
  }

  ngOnDestroy(): void {
    this.destroyed = true;
  }

  private getUrl(): string | null {
    if (this.jsonUrl) return this.jsonUrl;
    if (this.tier) return `${this.tier}.json`;
    return null;
  }

  private async renderIfPossible(): Promise<void> {
    if (this.destroyed) return;

    const url = this.getUrl();
    if (!url) return;

    const token = ++this.renderToken;

    // Clear existing SVG
    const svgEl = this.svgRef.nativeElement;
    d3.select(svgEl).selectAll("*").remove();

    let data: TreeDatum | null = null;
    try {
      data = await d3.json<TreeDatum>(url);
    } catch (e) {
      console.error("Failed to load JSON data:", e);
      return;
    }

    // if a newer render started, abort this one
    if (this.destroyed || token !== this.renderToken) return;
    if (!data) return;

    this.renderFromData(data, token);
  }

  private renderFromData(data: TreeDatum, token: number): void {
    const width = 1100;
    const margin = { top: 10, right: 10, bottom: 10, left: 100 };
    const dx = 17;

    const svgEl = this.svgRef.nativeElement;
    const containerEl = this.containerRef.nativeElement;

    const rootBase = d3.hierarchy<TreeDatum>(data);
    const root = rootBase as unknown as ExtendedNode;

    const dy = (width - margin.left - margin.right) / (1 + root.height);
    const treeLayout = d3.tree<TreeDatum>().nodeSize([dx, dy]);

    // Keep the diagonal typing pragmatic; remove any later if you want.
    const diagonal = d3
      .link<any, any>(curveFlowchart(0.925))
      .x((d: any) => d.y)
      .y((d: any) => d.x);

    const svg = d3
      .select(svgEl)
      .attr("width", width)
      .attr("height", dx)
      .attr("viewBox", [-margin.left, -margin.top, width, dx] as any)
      .attr(
        "style",
        "max-width: 100%; height: auto; font: 15px UFCsans; user-select: none;"
      );

    const gLink = svg
      .append("g")
      .attr("fill", "none")
      .attr("stroke", "gray")
      .attr("stroke-opacity", 1)
      .attr("stroke-width", 1.5);

    const gNode = svg.append("g").attr("cursor", "pointer").attr("pointer-events", "all");

    const update = (_event: unknown, source: ExtendedNode) => {
      if (this.destroyed || token !== this.renderToken) return;

      const duration = 50;
      const nodes = root.descendants().reverse() as ExtendedNode[];
      const links = root.links();

      treeLayout(root as unknown as d3.HierarchyNode<TreeDatum>);

      let left = root;
      let right = root;

      root.eachBefore((n) => {
        const node = n as ExtendedNode;
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
      });

      const height = right.x - left.x + margin.top + margin.bottom;

      const transition = svg
        .transition()
        .duration(duration)
        .attr("height", height)
        .attr("viewBox", [-margin.left, left.x - margin.top, width, height] as any);

      const node = gNode
        .selectAll<SVGGElement, ExtendedNode>("g")
        .data(nodes, (d) => d.id);

      const nodeEnter = node
        .enter()
        .append("g")
        .attr("transform", () => `translate(${source.y0},${source.x0})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .on("click", (evt, d) => {
          d.children = d.children ? null : d._children;
          update(evt, d);
        });

      nodeEnter
        .append("text")
        .attr("dy", "0.3em")
        .attr("x", 0)
        .attr("text-anchor", "start")
        .attr("opacity", (d) => d.data.opacity ?? 1)
        .text((d) => d.data.name);

      nodeEnter.each(function () {
        const textEl = d3.select(this).select<SVGTextElement>("text").node();
        if (!textEl) return;
        const bbox = textEl.getBBox();
        d3.select(this)
          .insert("rect", "text")
          .attr("x", bbox.x - 4)
          .attr("y", bbox.y - 2)
          .attr("width", bbox.width + 8)
          .attr("height", bbox.height + 4)
          .attr("fill", "white")
          .attr("stroke", "black")
          .attr("stroke-width", 0)
          .attr("fill-opacity", 1);
      });

      node
        .merge(nodeEnter as any)
        .transition(transition as any)
        .attr("transform", (d) => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

      node
        .exit()
        .transition(transition as any)
        .remove()
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0);

      const link = gLink
        .selectAll<SVGPathElement, d3.HierarchyLink<TreeDatum>>("path")
        .data(links, (d: any) => (d.target as any).id);

      const linkEnter = link
        .enter()
        .append("path")
        .attr("d", () => {
          const o: XY = { x: source.x0, y: source.y0 };
          return diagonal({ source: o, target: o }) ?? "";
        })
        .attr("stroke-opacity", (d) => (d.target.data.opacity ?? 1));

      link
        .merge(linkEnter as any)
        .transition(transition as any)
        .attr("d", (d: any) => diagonal(d) ?? "");

      link
        .exit()
        .transition(transition as any)
        .remove()
        .attr("d", () => {
          const o: XY = { x: source.x, y: source.y };
          return diagonal({ source: o, target: o }) ?? "";
        });

      root.eachBefore((d) => {
        const n = d as ExtendedNode;
        n.x0 = n.x;
        n.y0 = n.y;
      });
    };

    // init
    root.x0 = dy / 2;
    root.y0 = 0;

    (root.descendants() as ExtendedNode[]).forEach((d, i) => {
      d.id = i;
      d._children = (d.children as ExtendedNode[] | undefined) ?? null;
      d.children = null;
    });

    update(null, root);

    // auto expand
    void this.expandTree({ root, update }, containerEl, token);
  }

  private async expandTree(
    tree: { root: ExtendedNode; update: (e: unknown, s: ExtendedNode) => void },
    container: HTMLDivElement,
    token: number
  ): Promise<void> {
    const expandStepByStep = async (node: ExtendedNode): Promise<void> => {
      if (this.destroyed || token !== this.renderToken) return;

      const kids = node._children;
      if (!kids || kids.length === 0) return;

      node.children = [];
      node._children = null;

      for (const child of kids) {
        if (this.destroyed || token !== this.renderToken) return;

        node.children.push(child);
        tree.update({}, node);

        container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
        await sleep(this.expandDelay);

        if (child.data.expanded) {
          await expandStepByStep(child);
        }
      }
    };

    await expandStepByStep(tree.root);
  }
}
