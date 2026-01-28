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

  @Output() activeNodeIds = new EventEmitter<number[]>();

  @ViewChild('svg', { static: true }) private svgRef!: ElementRef<SVGSVGElement>;

  private initialized = false;
  private chart: GraphChartInstance | null = null;

  // unchanged values
  private readonly width = 600;
  private readonly height = 600;
  private readonly padding = 50;
  private readonly labelR = 1.02;

  ngAfterViewInit(): void {
    this.initialized = true;

    this.chart = createGraphChart(
      this.svgRef.nativeElement,
      {
        onActiveNodeIds: (ids) => this.activeNodeIds.emit(ids),
      },
      {
        width: this.width,
        height: this.height,
        padding: this.padding,
        labelR: this.labelR,
      }
    );

    this.chart.update(this.nodes ?? [], this.edges ?? []);
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized || !this.chart) return;
    if (changes['nodes'] || changes['edges']) {
      this.chart.update(this.nodes ?? [], this.edges ?? []);
    }
  }

  ngOnDestroy(): void {
    this.chart?.destroy();
    this.chart = null;
  }
}
