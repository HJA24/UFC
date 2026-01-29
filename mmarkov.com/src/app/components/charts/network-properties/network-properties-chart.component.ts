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

import {
  PropertiesDto,
  NetworkPropertyType,
  NetworkPropertyMeta
} from '../../../models/network/properties.dto';

@Component({
  selector: 'app-network-properties-chart',
  standalone: true,
  templateUrl: './network-properties-chart.component.html',
  styleUrl: './network-properties-chart.component.css',
})
export class NetworkPropertiesChartComponent implements AfterViewInit, OnChanges {
  @Input() properties: PropertiesDto | null = null;

  @Output() propertyHover = new EventEmitter<NetworkPropertyType | null>();

  @ViewChild('svg', { static: true }) private svgRef!: ElementRef<SVGSVGElement>;

  private initialized = false;

  private readonly width = 400;
  private readonly height = 280;
  private readonly margin = { top: 20, right: 30, bottom: 40, left: 120 };

  ngAfterViewInit(): void {
    this.initialized = true;
    this.render();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.initialized) return;
    if (changes['properties']) {
      this.render();
    }
  }

  private render(): void {
    if (!this.properties?.graph) return;

    const svg = d3.select(this.svgRef.nativeElement);
    svg.selectAll('*').remove();

    const innerWidth = this.width - this.margin.left - this.margin.right;
    const innerHeight = this.height - this.margin.top - this.margin.bottom;

    // Prepare data for all network properties
    const allProps = Object.values(NetworkPropertyType);
    const data = allProps
      .filter(key => this.properties!.graph[key] !== undefined)
      .map(key => ({
        key,
        property: NetworkPropertyMeta[key].label,
        value: this.properties!.graph[key] as number,
      }));

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleBand<string>()
      .domain(data.map(d => d.property))
      .range([0, innerHeight])
      .padding(0.3);

    // Main group
    const g = svg
      .attr('width', this.width)
      .attr('height', this.height)
      .append('g')
      .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

    // Shadow bars (3D effect)
    g.selectAll('.bar-shadow')
      .data(data)
      .join('rect')
      .attr('class', 'bar-shadow')
      .attr('x', 1)
      .attr('y', d => (yScale(d.property) ?? 0) + 1)
      .attr('width', d => xScale(d.value))
      .attr('height', yScale.bandwidth())
      .attr('rx', 3)
      .attr('fill', '#a0a0a0');

    // Main bars with hover
    g.selectAll('.bar')
      .data(data)
      .join('rect')
      .attr('class', 'bar')
      .attr('x', 0)
      .attr('y', d => yScale(d.property) ?? 0)
      .attr('width', d => xScale(d.value))
      .attr('height', yScale.bandwidth())
      .attr('rx', 3)
      .attr('fill', '#c0c0c0')
      .style('cursor', 'pointer')
      .on('mouseenter', (_, d) => this.propertyHover.emit(d.key))
      .on('mouseleave', () => this.propertyHover.emit(null));

    // Value labels
    g.selectAll('.value-label')
      .data(data)
      .join('text')
      .attr('class', 'value-label')
      .attr('x', d => xScale(d.value) + 8)
      .attr('y', d => (yScale(d.property) ?? 0) + yScale.bandwidth() / 2)
      .attr('dy', '0.35em')
      .attr('fill', 'rgb(100, 100, 100)')
      .attr('font-size', '12px')
      .attr('font-family', 'UFCSans, sans-serif')
      .text(d => d.value.toFixed(2));

    // Y-axis (property labels)
    g.append('g')
      .attr('class', 'y-axis')
      .call(d3.axisLeft(yScale).tickSize(0))
      .call(g => g.select('.domain').remove())
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'rgb(50, 50, 50)')
        .attr('font-size', '13px')
        .attr('font-family', 'UFCSans, sans-serif')
        .attr('font-weight', 'bold')
        .style('cursor', 'pointer'))
      .selectAll('.tick')
      .each((d, i, nodes) => {
        const tick = d3.select(nodes[i]);
        const propertyData = data.find(item => item.property === d);
        if (propertyData) {
          tick.on('mouseenter', () => this.propertyHover.emit(propertyData.key))
              .on('mouseleave', () => this.propertyHover.emit(null));
        }
      });

    // X-axis
    g.append('g')
      .attr('class', 'x-axis')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).ticks(5).tickFormat(d3.format('.1f')))
      .call(g => g.select('.domain').attr('stroke', 'rgb(200, 200, 200)'))
      .call(g => g.selectAll('.tick line').attr('stroke', 'rgb(200, 200, 200)'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'rgb(100, 100, 100)')
        .attr('font-size', '11px'));
  }
}
