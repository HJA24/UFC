import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  signal,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import * as d3 from 'd3';

import {
  PropertiesDto,
  NetworkPropertyType,
  NetworkPropertyMeta
} from '../../../models/network/properties.dto';

@Component({
  selector: 'app-network-properties',
  standalone: true,
  imports: [],
  templateUrl: './network-properties.component.html',
  styleUrl: './network-properties.component.css',
})
export class NetworkPropertiesComponent implements AfterViewInit, OnChanges {
  @Input() properties: PropertiesDto | null = null;

  @ViewChild('propertiesChart') propertiesChartRef!: ElementRef<HTMLDivElement>;
  @ViewChild('chartSvg') chartSvgRef!: ElementRef<SVGSVGElement>;

  hoveredProperty = signal<NetworkPropertyType | null>(null);
  PropertyType = NetworkPropertyType;

  private viewReady = false;
  private readonly rowHeight = 14;
  private readonly rowGap = 12;
  private readonly labelWidth = 90;
  private readonly valueWidth = 40;
  private readonly axisHeight = 20;

  private readonly propertyOrder: NetworkPropertyType[] = [
    NetworkPropertyType.DENSITY,
    NetworkPropertyType.CLUSTERING,
    NetworkPropertyType.TRANSITIVITY,
    NetworkPropertyType.EFFICIENCY,
    NetworkPropertyType.CONNECTIVITY
  ];

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.properties) {
      this.renderChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['properties'] && this.viewReady) {
      this.renderChart();
    }
  }

  get propertyLabel(): string {
    const prop = this.hoveredProperty();
    if (!prop) return '';
    return NetworkPropertyMeta[prop]?.label || '';
  }

  get description(): string {
    const prop = this.hoveredProperty();
    if (!prop) return '';
    const fullDescription = NetworkPropertyMeta[prop]?.description || '';
    const label = NetworkPropertyMeta[prop]?.label || '';
    const capitalizedLabel = label.charAt(0).toUpperCase() + label.slice(1);
    if (fullDescription.startsWith(capitalizedLabel)) {
      return fullDescription.slice(capitalizedLabel.length).trimStart();
    }
    return fullDescription;
  }

  onPropertyHover(property: NetworkPropertyType | null): void {
    this.hoveredProperty.set(property);
  }

  private renderChart(): void {
    if (!this.chartSvgRef) return;

    const svg = d3.select(this.chartSvgRef.nativeElement);
    svg.selectAll('*').remove();

    const containerWidth = this.propertiesChartRef?.nativeElement?.clientWidth || 300;
    const barWidth = containerWidth - this.labelWidth - this.valueWidth;
    const barsHeight = this.propertyOrder.length * (this.rowHeight + this.rowGap) - this.rowGap;
    const totalHeight = barsHeight + this.axisHeight;

    svg
      .attr('width', '100%')
      .attr('height', totalHeight);

    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, barWidth]);

    // X-axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d3.format('.1f'));

    svg.append('g')
      .attr('transform', `translate(${this.labelWidth}, ${barsHeight + 4})`)
      .call(xAxis)
      .call(g => g.select('.domain').attr('stroke', '#c0c0c0'))
      .call(g => g.selectAll('.tick line').attr('stroke', '#c0c0c0'))
      .call(g => g.selectAll('.tick text')
        .attr('fill', 'rgb(100, 100, 100)')
        .attr('font-size', '10px')
        .attr('font-family', 'UFCSans, sans-serif'));

    this.propertyOrder.forEach((propertyType, index) => {
      const value = this.properties?.graph?.[propertyType];
      if (value === undefined) return;

      const y = index * (this.rowHeight + this.rowGap);
      const label = NetworkPropertyMeta[propertyType]?.label || propertyType.toLowerCase();

      // Invisible hover area for the entire row
      svg.append('rect')
        .attr('x', 0)
        .attr('y', y)
        .attr('width', containerWidth)
        .attr('height', this.rowHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('mouseenter', () => this.onPropertyHover(propertyType))
        .on('mouseleave', () => this.onPropertyHover(null));

      // Property label
      svg.append('text')
        .attr('x', this.labelWidth - 8)
        .attr('y', y + this.rowHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .attr('fill', 'rgb(50, 50, 50)')
        .attr('font-size', '11px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'UFCSans, sans-serif')
        .style('pointer-events', 'none')
        .text(label);

      const duration = 1000;

      // Background track
      svg.append('rect')
        .attr('x', this.labelWidth)
        .attr('y', y)
        .attr('width', barWidth)
        .attr('height', this.rowHeight)
        .attr('fill', '#f0f0f0')
        .style('pointer-events', 'none');

      // Value bar
      svg.append('rect')
        .attr('x', this.labelWidth)
        .attr('y', y)
        .attr('width', 0)
        .attr('height', this.rowHeight)
        .attr('fill', '#a0a0a0')
        .style('pointer-events', 'none')
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .attr('width', xScale(value));

      // Value label
      svg.append('text')
        .attr('x', this.labelWidth + 6)
        .attr('y', y + this.rowHeight / 2)
        .attr('dy', '0.35em')
        .attr('fill', 'rgb(80, 80, 80)')
        .attr('font-size', '11px')
        .attr('font-family', 'UFCSans, sans-serif')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .transition()
        .duration(duration)
        .ease(d3.easeCubicOut)
        .attr('x', this.labelWidth + xScale(value) + 6)
        .style('opacity', 1)
        .text(value.toFixed(2));
    });
  }
}
