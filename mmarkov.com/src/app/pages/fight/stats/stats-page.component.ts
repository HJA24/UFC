import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { ActivatedRoute } from "@angular/router";
import { map, switchMap } from "rxjs";

import { StatsService } from "../../../services/stats.service";
import { HdisChartComponent, HdiRow, HdiInterval } from "../../../components/hdi/hdis-chart/hdis-chart.component";
import { HDI_CONFIG } from "../../../config/hdi.config";
import { STATS_ITEMS } from "./stats.items";

interface StatChartData {
  stat: string;
  label: string;
  rows: HdiRow[];
  domain: [number, number];
}

@Component({
  selector: 'app-stats-page',
  standalone: true,
  imports: [HdisChartComponent],
  templateUrl: './stats-page.component.html',
  styleUrl: './stats-page.component.css',
})
export class StatsPageComponent implements OnInit {
  private statsService = inject(StatsService);
  private route = inject(ActivatedRoute);

  private statsData = signal<any>(null);

  readonly chartData = computed<StatChartData[]>(() => {
    const data = this.statsData();
    if (!data?.stats) return [];

    return STATS_ITEMS
      .filter((item: { variable: string; label: string }) => data.stats[item.variable])
      .map((item: { variable: string; label: string }) => {
        const perFighter = data.stats[item.variable];
        const blueHdis = this.transformHdis(perFighter.blue, 'blue');
        const redHdis = this.transformHdis(perFighter.red, 'red');
        const allIntervals = [...blueHdis, ...redHdis];
        const min = Math.min(...allIntervals.map(h => h.lower));
        const max = Math.max(...allIntervals.map(h => h.upper));

        return {
          stat: item.variable,
          label: item.label,
          rows: [
            { label: 'Blue', hdis: blueHdis },
            { label: 'Red', hdis: redHdis },
          ],
          domain: [min, max] as [number, number],
        };
      });
  });

  ngOnInit(): void {
    this.route.parent!.paramMap.pipe(
      map(params => Number(params.get('fightId'))),
      switchMap(fightId => this.statsService.getFightStats(fightId))
    ).subscribe(stats => {
      this.statsData.set(stats);
    });
  }

  private transformHdis(hdis: Record<string, { min: number; max: number }>, color: 'blue' | 'red'): HdiInterval[] {
    return Object.entries(HDI_CONFIG).map(([label, config]) => {
      const levelKey = label.replace('%', '');
      return {
        lower: hdis[config.level]?.min ?? 0,
        upper: hdis[config.level]?.max ?? 0,
        color: `var(--hdi-${levelKey}-color-${color})`,
        zIndex: config.zIndex,
      };
    });
  }
}
