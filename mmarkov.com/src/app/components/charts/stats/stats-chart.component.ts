import {AfterViewInit, Component, ElementRef, input, OnChanges, SimpleChanges, ViewChild} from '@angular/core';
import * as d3 from "d3";
import {HdiRow} from "src/app/components/hdi/hdis-chart/hdis-chart.component";

@Component({
  selector: 'app-stats-chart',
  standalone: true,
  imports: [],
  templateUrl: './stats-chart.component.html',
  styleUrl: './stats-chart.component.css',
})
export class StatsChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('container', {static: true}) containerRef!: ElementRef<HTMLDivElement>;

  /** Array of rows (e.g., blue fighter, red fighter) */
  rows = input.required<HdiRow[]>();

  /** Chart width */
  width = input<number>(400);

  /** Domain for x-axis [min, max] */
  domain = input<[number, number]>([0, 1]);

  /** Height of each row */
  rowHeight = input<number>(30);

  /** Spacing between rows */
  rowSpacing = input<number>(8);

  private ready = false;

  ngAfterViewInit(): void {
    this.ready = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.ready) {
      this.render();
    }
  }

  private render(): void {
    const container = this.containerRef.nativeElement;
    container.innerHTML = '';

    const rows = this.rows();
    if (!rows || rows.length === 0) return;

    const margin = {top: 10, right: 20, bottom: 30, left: 20};
    const chartWidth = this.width();
    const chartHeight = rows.length * (this.rowHeight() + this.rowSpacing()) + margin.top + margin.bottom;
    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = chartHeight - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(container)
      .append('svg')
      .attr('width', chartWidth)
      .attr('height', chartHeight)
      .attr('viewBox', [0, 0, chartWidth, chartHeight])
      .attr('style', 'max-width: 100%; height: auto;');

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(this.domain())
      .range([0, innerWidth]);

    const yScale = d3.scaleBand<number>()
      .domain(d3.range(rows.length))
      .range([0, innerHeight])
      .padding(0.2);

    // X-axis
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5))
      .call(g => g.select('.domain').attr('stroke', 'rgb(200, 200, 200)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgb(200, 200, 200)'))
      .call(g => g.selectAll('.tick text').attr('fill', 'rgb(100, 100, 100)'));

    const rowHeight = yScale.bandwidth();

    // Render each row
    rows.forEach((row, rowIndex) => {
      const rowG = g.append('g')
        .attr('transform', `translate(0,${yScale(rowIndex)})`);

      // Sort HDIs by zIndex (lowest first = render first = background)
      const sortedHdis = [...row.hdis].sort((a, b) => a.zIndex - b.zIndex);

      // Render overlapping HDI bars
      sortedHdis.forEach(hdi => {
        // Interval rectangle
        rowG.append('rect')
          .attr('x', xScale(hdi.lower))
          .attr('y', 0)
          .attr('width', xScale(hdi.upper) - xScale(hdi.lower))
          .attr('height', rowHeight)
          .attr('fill', hdi.color);

        // Lower bound line
        rowG.append('line')
          .attr('x1', xScale(hdi.lower))
          .attr('x2', xScale(hdi.lower))
          .attr('y1', 0)
          .attr('y2', rowHeight)
          .attr('stroke', hdi.color)
          .attr('stroke-width', 2);

        // Upper bound line
        rowG.append('line')
          .attr('x1', xScale(hdi.upper))
          .attr('x2', xScale(hdi.upper))
          .attr('y1', 0)
          .attr('y2', rowHeight)
          .attr('stroke', hdi.color)
          .attr('stroke-width', 2);
      });
    });
  }

}
