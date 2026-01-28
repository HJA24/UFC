import { Component, ElementRef, AfterViewInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

export interface HdiData {
  label: string;
  value: number;
  hdi50: [number, number];
  hdi75: [number, number];
  hdi90: [number, number];
  hdi95: [number, number];
}

@Component({
  selector: 'app-hdi-radar',
  standalone: true,
  templateUrl: './hdi-radar.component.html',
  styleUrl: './hdi-radar.component.css'
})
export class HdiRadarComponent implements AfterViewInit, OnChanges {
  @ViewChild('chart') chartRef!: ElementRef<SVGSVGElement>;

  @Input() data: HdiData[] = [];
  @Input() color: 'blue' | 'red' = 'blue';
  @Input() width: number = 300;
  @Input() height: number = 300;

  private margin = { top: 40, right: 40, bottom: 40, left: 40 };
  private initialized = false;

  ngAfterViewInit(): void {
    this.drawChart();
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && (changes['data'] || changes['color'])) {
      this.updateChart();
    }
  }

  private drawChart(): void {
    if (!this.data.length) return;

    const svg = d3.select(this.chartRef.nativeElement);
    svg.selectAll('*').remove();

    const width = this.width - this.margin.left - this.margin.right;
    const height = this.height - this.margin.top - this.margin.bottom;
    const radius = Math.min(width, height) / 2;

    const g = svg.append('g')
      .attr('transform', `translate(${this.width / 2},${this.height / 2})`);

    const angleSlice = (Math.PI * 2) / this.data.length;

    // Radial scale
    const rScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, radius]);

    // Draw grid circles
    const gridLevels = [0.25, 0.5, 0.75, 1];
    gridLevels.forEach(level => {
      g.append('circle')
        .attr('r', rScale(level))
        .attr('fill', 'none')
        .attr('stroke', 'rgba(200, 200, 200, 0.5)')
        .attr('stroke-width', 1);
    });

    // Draw axis lines
    this.data.forEach((_, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', rScale(1) * Math.cos(angle))
        .attr('y2', rScale(1) * Math.sin(angle))
        .attr('stroke', 'rgba(200, 200, 200, 0.5)')
        .attr('stroke-width', 1);
    });

    // Draw labels
    this.data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      const labelRadius = radius + 20;
      g.append('text')
        .attr('x', labelRadius * Math.cos(angle))
        .attr('y', labelRadius * Math.sin(angle))
        .attr('text-anchor', 'middle')
        .attr('dominant-baseline', 'middle')
        .style('font-family', 'UFCSans, sans-serif')
        .style('font-size', '11px')
        .style('fill', 'rgb(50, 50, 50)')
        .text(d.label);
    });

    // Get CSS variable colors
    const colorVar = this.color === 'blue' ? '--color-blue' : '--color-red';
    const baseColor = getComputedStyle(document.documentElement).getPropertyValue(colorVar).trim() || (this.color === 'blue' ? '#0045b9' : '#bf0700');

    // Draw HDI bands (95, 90, 75, 50 - outer to inner)
    const hdiBands: { key: keyof HdiData; opacity: number }[] = [
      { key: 'hdi95', opacity: 0.15 },
      { key: 'hdi90', opacity: 0.25 },
      { key: 'hdi75', opacity: 0.4 },
      { key: 'hdi50', opacity: 0.6 }
    ];

    hdiBands.forEach(band => {
      const areaGenerator = d3.areaRadial<HdiData>()
        .angle((_, i) => angleSlice * i)
        .innerRadius(d => rScale((d[band.key] as [number, number])[0]))
        .outerRadius(d => rScale((d[band.key] as [number, number])[1]))
        .curve(d3.curveLinearClosed);

      g.append('path')
        .datum(this.data)
        .attr('d', areaGenerator)
        .attr('fill', baseColor)
        .attr('fill-opacity', band.opacity);
    });

    // Draw point estimate line
    const lineGenerator = d3.lineRadial<HdiData>()
      .angle((_, i) => angleSlice * i)
      .radius(d => rScale(d.value))
      .curve(d3.curveLinearClosed);

    g.append('path')
      .datum(this.data)
      .attr('d', lineGenerator)
      .attr('fill', 'none')
      .attr('stroke', baseColor)
      .attr('stroke-width', 2);

    // Draw point estimate dots
    this.data.forEach((d, i) => {
      const angle = angleSlice * i - Math.PI / 2;
      g.append('circle')
        .attr('cx', rScale(d.value) * Math.cos(angle))
        .attr('cy', rScale(d.value) * Math.sin(angle))
        .attr('r', 4)
        .attr('fill', baseColor);
    });
  }

  private updateChart(): void {
    this.drawChart();
  }
}
