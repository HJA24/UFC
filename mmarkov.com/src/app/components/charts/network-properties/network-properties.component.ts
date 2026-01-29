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

  expandedProperty = signal<NetworkPropertyType | null>(null);

  private viewReady = false;
  private readonly rowHeight = 20;
  private readonly rowGap = 8;
  private readonly labelWidth = 0;
  private readonly valueWidth = 0;
  private readonly descriptionHeight = 40;
  private readonly animationDuration = 300;

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

  onPropertyClick(property: NetworkPropertyType): void {
    const current = this.expandedProperty();
    this.expandedProperty.set(current === property ? null : property);
    this.updateChart();
  }

  private getRowY(index: number): number {
    const expanded = this.expandedProperty();
    let y = 0;
    for (let i = 0; i < index; i++) {
      y += this.rowHeight + this.rowGap;
      if (this.propertyOrder[i] === expanded) {
        y += this.descriptionHeight + this.rowGap;
      }
    }
    return y;
  }

  private getTotalHeight(): number {
    const expanded = this.expandedProperty();
    let height = this.propertyOrder.length * (this.rowHeight + this.rowGap) - this.rowGap;
    if (expanded) {
      height += this.descriptionHeight + this.rowGap;
    }
    return height;
  }

  private renderChart(): void {
    if (!this.chartSvgRef) return;

    const svg = d3.select(this.chartSvgRef.nativeElement);
    svg.selectAll('*').remove();

    const containerWidth = this.propertiesChartRef?.nativeElement?.clientWidth || 300;
    const barWidth = containerWidth - this.labelWidth - this.valueWidth;

    svg.attr('width', '100%');

    const xScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, barWidth]);

    this.propertyOrder.forEach((propertyType, index) => {
      const value = this.properties?.graph?.[propertyType];
      if (value === undefined) return;

      const y = this.getRowY(index);
      const label = NetworkPropertyMeta[propertyType]?.label || propertyType.toLowerCase();
      const description = NetworkPropertyMeta[propertyType]?.description || '';

      // Row group
      const rowGroup = svg.append('g')
        .attr('class', `row-${propertyType}`)
        .attr('transform', `translate(0, ${y})`);

      // Clickable area
      rowGroup.append('rect')
        .attr('class', 'click-area')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', containerWidth)
        .attr('height', this.rowHeight)
        .attr('fill', 'transparent')
        .style('cursor', 'pointer')
        .on('click', () => this.onPropertyClick(propertyType));

      // Background track
      rowGroup.append('rect')
        .attr('class', 'track')
        .attr('x', this.labelWidth)
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', this.rowHeight)
        .attr('fill', '#f0f0f0')
        .style('pointer-events', 'none');

      // Shadow bar (3D effect)
      rowGroup.append('rect')
        .attr('class', 'bar-shadow')
        .attr('x', this.labelWidth + 2)
        .attr('y', 2)
        .attr('width', 0)
        .attr('height', this.rowHeight)
        .attr('fill', '#808080')
        .style('pointer-events', 'none')
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('width', xScale(value));

      // Value bar
      rowGroup.append('rect')
        .attr('class', 'bar')
        .attr('x', this.labelWidth)
        .attr('y', 0)
        .attr('width', 0)
        .attr('height', this.rowHeight)
        .attr('fill', '#a0a0a0')
        .style('pointer-events', 'none')
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('width', xScale(value));

      // Property label (on top of bar)
      rowGroup.append('text')
        .attr('class', 'label')
        .attr('x', 8)
        .attr('y', this.rowHeight / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .attr('fill', 'rgb(50, 50, 50)')
        .attr('font-size', '14px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'UFCSans, sans-serif')
        .style('pointer-events', 'none')
        .text(label);

      // Value label
      rowGroup.append('text')
        .attr('class', 'value')
        .attr('x', this.labelWidth + 6)
        .attr('y', this.rowHeight / 2)
        .attr('dy', '0.35em')
        .attr('fill', 'rgb(80, 80, 80)')
        .attr('font-size', '14px')
        .attr('font-family', 'UFCSans, sans-serif')
        .style('pointer-events', 'none')
        .style('opacity', 0)
        .transition()
        .duration(1000)
        .ease(d3.easeCubicOut)
        .attr('x', this.labelWidth + xScale(value) + 6)
        .style('opacity', 1)
        .text(value.toFixed(2));

      // Description container (hidden initially)
      const descGroup = rowGroup.append('g')
        .attr('class', 'description')
        .attr('transform', `translate(0, ${this.rowHeight + this.rowGap})`)
        .style('opacity', 0);

      // Description background
      descGroup.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', barWidth)
        .attr('height', this.descriptionHeight)
        .attr('fill', 'white')
        .attr('rx', 3);

      // Description text using foreignObject
      descGroup.append('foreignObject')
        .attr('x', 8)
        .attr('y', 4)
        .attr('width', barWidth - 16)
        .attr('height', this.descriptionHeight - 8)
        .append('xhtml:div')
        .style('font-family', 'UFCSans, sans-serif')
        .style('font-size', '13px')
        .style('font-style', 'italic')
        .style('line-height', '1.4')
        .style('color', 'rgb(100, 100, 100)')
        .style('white-space', 'pre-line')
        .style('overflow', 'hidden')
        .text(description);
    });

    this.updateChart();
  }

  private updateChart(): void {
    if (!this.chartSvgRef) return;

    const svg = d3.select(this.chartSvgRef.nativeElement);
    const expanded = this.expandedProperty();

    // Update SVG height
    svg.transition()
      .duration(this.animationDuration)
      .attr('height', this.getTotalHeight());

    // Update row positions and description visibility
    this.propertyOrder.forEach((propertyType, index) => {
      const y = this.getRowY(index);
      const isExpanded = propertyType === expanded;

      svg.select(`.row-${propertyType}`)
        .transition()
        .duration(this.animationDuration)
        .attr('transform', `translate(0, ${y})`);

      svg.select(`.row-${propertyType} .description`)
        .transition()
        .duration(this.animationDuration)
        .style('opacity', isExpanded ? 1 : 0);
    });
  }
}
