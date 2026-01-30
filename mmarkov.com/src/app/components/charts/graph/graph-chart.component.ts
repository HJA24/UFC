import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
  ViewEncapsulation
} from '@angular/core';

import { NodeDto, EdgeDto } from '../../../models/network/graph.dto';
import { createGraphChart, GraphChartInstance } from './graph-chart.d3';

@Component({
  selector: 'app-graph-data-chart',
  standalone: true,
  encapsulation: ViewEncapsulation.None,
  templateUrl: './graph-chart.component.html',
  styleUrls: ['./graph-chart.component.css'],
})
export class GraphChartComponent implements AfterViewInit, OnChanges, OnDestroy {
  @Input() nodes: NodeDto[] | null = null;
  @Input() edges: EdgeDto[] | null = null;
  @Input() pos: 'circular' | 'spring' = 'circular';

  @Output() activeNodeId = new EventEmitter<number | null>();

  @ViewChild('svg', { static: true }) private svgRef!: ElementRef<SVGSVGElement>;

  private initialized = false;
  private chart: GraphChartInstance | null = null;

  // unchanged values
  private readonly width = 650;
  private readonly height = 650;
  private readonly padding = 50;

  ngAfterViewInit(): void {
    this.initialized = true;

    this.chart = createGraphChart(
      this.svgRef.nativeElement,
      {
        onActiveNodeId: (id) => this.activeNodeId.emit(id),
      },
      {
        width: this.width,
        height: this.height,
        padding: this.padding,
      }
    );

    this.chart.update(this.nodes ?? [], this.edges ?? [], this.pos);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !this.chart) return;
    if (changes['nodes'] || changes['edges'] || changes['pos']) {
      this.chart.update(this.nodes ?? [], this.edges ?? [], this.pos);
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}
