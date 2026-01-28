import { Component, inject, OnInit, ElementRef, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { map, switchMap } from "rxjs";
import * as d3 from 'd3';

import { StatsService } from "../../../services/stats.service";
import { StatsDto, StatsPerFighterDto } from "../../../models/stats/stats.dto";
import { HDI_CONFIG } from "../../../config/hdi.config";

const HDI_COLORS = {
  blue: {
    '50': { main: '#0045b9', shadow: '#002a70' },
    '75': { main: '#668fd5', shadow: '#3d5a8a' },
    '90': { main: '#9fb9e5', shadow: '#6a8cb8' },
    '95': { main: '#bfd0ed', shadow: '#8fa8c4' },
  },
  red: {
    '50': { main: '#bf0700', shadow: '#7a0400' },
    '75': { main: '#d46b66', shadow: '#8a3d3a' },
    '90': { main: '#e5a19f', shadow: '#b86a68' },
    '95': { main: '#edc0bf', shadow: '#c48f8e' },
  }
} as const;

interface HdiInterval {
  lower: number;
  upper: number;
  color: string;
  shadowColor: string;
  zIndex: number;
  level: string;
}

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [],
  templateUrl: './stats-page.component.html',
  styleUrl: './stats-page.component.css',
})
export class StatsPageComponent implements OnInit, AfterViewInit {
  private statsService = inject(StatsService);
  private route = inject(ActivatedRoute);

  @ViewChild('numberOfStrikesAttempted') numberOfStrikesAttemptedSvg!: ElementRef<SVGSVGElement>;
  @ViewChild('numberOfStrikesLanded') numberOfStrikesLandedSvg!: ElementRef<SVGSVGElement>;
  @ViewChild('numberOfSubmissionsAttempted') numberOfSubmissionsAttemptedSvg!: ElementRef<SVGSVGElement>;
  @ViewChild('numberOfTakedownsLanded') numberOfTakedownsLandedSvg!: ElementRef<SVGSVGElement>;
  @ViewChild('timeSpentInControl') timeSpentInControlSvg!: ElementRef<SVGSVGElement>;

  private statsData: StatsDto | null = null;
  private viewReady = false;

  ngOnInit(): void {
    this.route.parent!.paramMap.pipe(
      map(params => Number(params.get('fightId'))),
      switchMap(fightId => this.statsService.getFightStats(fightId))
    ).subscribe(stats => {
      this.statsData = stats;
      if (this.viewReady) {
        this.renderAllCharts();
      }
    });
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    if (this.statsData) {
      this.renderAllCharts();
    }
  }

  private renderAllCharts(): void {
    if (!this.statsData?.stats) return;

    const { stats } = this.statsData;

    if (stats.numberOfStrikesAttempted) {
      this.renderChart(this.numberOfStrikesAttemptedSvg, stats.numberOfStrikesAttempted);
    }
    if (stats.numberOfStrikesLanded) {
      this.renderChart(this.numberOfStrikesLandedSvg, stats.numberOfStrikesLanded);
    }
    if (stats.numberOfSubmissionsAttempted) {
      this.renderChart(this.numberOfSubmissionsAttemptedSvg, stats.numberOfSubmissionsAttempted);
    }
    if (stats.numberOfTakedownsLanded) {
      this.renderChart(this.numberOfTakedownsLandedSvg, stats.numberOfTakedownsLanded);
    }
    if (stats.timeSpentInControl) {
      this.renderChart(this.timeSpentInControlSvg, stats.timeSpentInControl);
    }
  }

  private renderChart(svgRef: ElementRef<SVGSVGElement>, data: StatsPerFighterDto): void {
    const svg = svgRef.nativeElement;

    // Clear previous content
    d3.select(svg).selectAll('*').remove();

    const blueHdis = this.transformHdis(data.blue, 'blue');
    const redHdis = this.transformHdis(data.red, 'red');
    const rows = [
      { label: 'Blue', hdis: blueHdis },
      { label: 'Red', hdis: redHdis },
    ];

    // Calculate domain
    const allIntervals = [...blueHdis, ...redHdis];
    const min = Math.min(...allIntervals.map(h => h.lower));
    const max = Math.max(...allIntervals.map(h => h.upper));
    const domain: [number, number] = [min, max];

    // Dimensions
    const width = 800;
    const height = 100;
    const margin = { top: 5, right: 20, bottom: 28, left: 20 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Setup SVG
    const svgSelection = d3.select(svg)
      .attr('width', width)
      .attr('height', height)
      .attr('viewBox', [0, 0, width, height]);

    // Add drop shadow filter
    const defs = svgSelection.append('defs');
    const filter = defs.append('filter')
      .attr('id', 'drop-shadow')
      .attr('x', '-20%')
      .attr('y', '-20%')
      .attr('width', '140%')
      .attr('height', '140%');

    filter.append('feDropShadow')
      .attr('dx', 0)
      .attr('dy', 2)
      .attr('stdDeviation', 2)
      .attr('flood-color', 'rgba(0, 0, 0, 0.15)');

    const g = svgSelection.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scaleLinear()
      .domain(domain)
      .nice()
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
      .call(g => g.selectAll('.tick text').attr('fill', 'rgb(100, 100, 100)').attr('font-size', '12px'));

    const rowHeight = yScale.bandwidth();

    // Render each row
    rows.forEach((row, rowIndex) => {
      const rowG = g.append('g')
        .attr('transform', `translate(0,${yScale(rowIndex)})`);

      // Sort HDIs by zIndex (lowest first = render first = background)
      const sortedHdis = [...row.hdis].sort((a, b) => a.zIndex - b.zIndex);

      // Render overlapping HDI bars with 3D stacked offset effect
      sortedHdis.forEach(hdi => {
        const offsetX = 1;
        const offsetY = 1;

        // Shadow rectangle (offset behind)
        rowG.append('rect')
          .attr('class', `hdi-shadow hdi-level-${hdi.level}`)
          .attr('data-level', hdi.level)
          .attr('x', xScale(hdi.lower) + offsetX)
          .attr('y', offsetY)
          .attr('width', xScale(hdi.upper) - xScale(hdi.lower))
          .attr('height', rowHeight)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('fill', hdi.shadowColor)
          .style('transition', 'opacity 0.2s ease');

        // Main rectangle (on top)
        rowG.append('rect')
          .attr('class', `hdi-rect hdi-level-${hdi.level}`)
          .attr('data-level', hdi.level)
          .attr('x', xScale(hdi.lower))
          .attr('y', 0)
          .attr('width', xScale(hdi.upper) - xScale(hdi.lower))
          .attr('height', rowHeight)
          .attr('rx', 5)
          .attr('ry', 5)
          .attr('fill', hdi.color)
          .style('cursor', 'pointer')
          .style('transition', 'opacity 0.2s ease')
          .on('mouseenter', function() {
            const level = d3.select(this).attr('data-level');
            d3.selectAll('.hdi-rect, .hdi-shadow').filter(function() {
              return d3.select(this).attr('data-level') !== level;
            }).style('opacity', 0);
          })
          .on('mouseleave', function() {
            d3.selectAll('.hdi-rect, .hdi-shadow').style('opacity', 1);
          });
      });
    });
  }

  private transformHdis(hdis: Record<string, { min: number; max: number }>, color: 'blue' | 'red'): HdiInterval[] {
    return Object.entries(HDI_CONFIG).map(([label, config]) => {
      const levelKey = label.replace('%', '') as keyof typeof HDI_COLORS['blue'];
      const colors = HDI_COLORS[color][levelKey];
      return {
        lower: hdis[config.level]?.min ?? 0,
        upper: hdis[config.level]?.max ?? 0,
        color: colors.main,
        shadowColor: colors.shadow,
        zIndex: config.zIndex,
        level: levelKey,
      };
    });
  }
}
