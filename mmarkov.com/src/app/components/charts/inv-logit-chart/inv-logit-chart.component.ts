import { Component, ElementRef, AfterViewInit, ViewChild, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3';

export const invLogit = (x: number): number => 1 / (1 + Math.exp(-x));

@Component({
  selector: 'app-inv-logit-chart',
  standalone: true,
  templateUrl: './inv-logit-chart.component.html',
  styleUrl: './inv-logit-chart.component.css'
})
export class InvLogitChartComponent implements AfterViewInit, OnChanges {
  @ViewChild('chart') chartRef!: ElementRef<SVGSVGElement>;
  @Input() deltaSkill: number = 0;
  @Input() width: number = 400;
  @Input() height: number = 200;

  private margin = { top: 20, right: 20, bottom: 40, left: 50 };
  private xScale!: d3.ScaleLinear<number, number>;
  private yScale!: d3.ScaleLinear<number, number>;
  private initialized = false;

  get theta(): number {
    return invLogit(this.deltaSkill);
  }

  ngAfterViewInit(): void {
    this.drawChart();
    this.initialized = true;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && changes['deltaSkill']) {
      this.updateScatterPoint();
    }
  }

  private drawChart(): void {
    const svg = d3.select(this.chartRef.nativeElement);
    const width = this.width - this.margin.left - this.margin.right;
    const height = this.height - this.margin.top - this.margin.bottom;

    const g = svg.append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // X scale: real numbers from -10 to 10
    this.xScale = d3.scaleLinear()
      .domain([-10, 10])
      .range([0, width]);

    // Y scale: theta from 0 to 1
    this.yScale = d3.scaleLinear()
      .domain([0, 1])
      .range([height, 0]);

    // Generate line data
    const lineData: [number, number][] = [];
    for (let x = -10; x <= 10; x += 0.1) {
      lineData.push([x, invLogit(x)]);
    }

    // Draw the inverse logit curve
    const line = d3.line<[number, number]>()
      .x(d => this.xScale(d[0]))
      .y(d => this.yScale(d[1]))
      .curve(d3.curveBasis);

    g.append('path')
      .datum(lineData)
      .attr('class', 'inv-logit-line')
      .attr('fill', 'none')
      .attr('stroke', 'rgb(200, 200, 200)')
      .attr('stroke-width', 2)
      .attr('d', line);

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(this.xScale).ticks(6))
      .style('font-family', 'UFCSans, sans-serif');

    // X axis label
    g.append('text')
      .attr('x', width / 2)
      .attr('y', height + 35)
      .attr('fill', 'rgb(80, 80, 80)')
      .attr('text-anchor', 'middle')
      .style('font-family', 'UFCSans, sans-serif')
      .style('font-style', 'italic')
      .style('font-size', '12px')
      .text('Δλ');

    // Y axis
    g.append('g')
      .call(d3.axisLeft(this.yScale).ticks(5))
      .style('font-family', 'UFCSans, sans-serif');

    // Y axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('x', -height / 2)
      .attr('y', -35)
      .attr('fill', 'rgb(80, 80, 80)')
      .attr('text-anchor', 'middle')
      .style('font-family', 'UFCSans, sans-serif')
      .style('font-style', 'italic')
      .style('font-size', '12px')
      .text('θ');

    // Scatter point for current deltaSkill
    g.append('circle')
      .attr('class', 'scatter-point')
      .attr('cx', this.xScale(this.deltaSkill))
      .attr('cy', this.yScale(this.theta))
      .attr('r', 5)
      .attr('fill', 'rgb(200, 200, 200)');
  }

  private updateScatterPoint(): void {
    if (!this.chartRef || !this.xScale || !this.yScale) return;

    const svg = d3.select(this.chartRef.nativeElement);

    svg.select('.scatter-point')
      .attr('cx', this.xScale(this.deltaSkill))
      .attr('cy', this.yScale(this.theta));
  }
}
