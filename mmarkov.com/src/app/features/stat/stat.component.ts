import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { StatService } from '../../services/stat.service';
import type { StatDto } from '../../models/stat.dto';
import type { StatType } from '../../models/stat-type';

@Component({
    selector: 'app-stat',
    templateUrl: './stat.component.html',
    styleUrls: ['./stat.component.scss'],
    standalone: false
})
export class StatComponent implements OnInit {
  fightId!: number;
  fighterId!: number;

  stats: StatDto[] = [];
  isLoading = false;
  error: string | null = null;

  selectedStatType: StatType | null = null;

  constructor(
    private route: ActivatedRoute,
    private statService: StatService
  ) {}

  ngOnInit(): void {
    const fightIdParam = this.route.snapshot.paramMap.get('fightId');
    const fighterIdParam = this.route.snapshot.paramMap.get('fighterId');

    if (fightIdParam == null || fighterIdParam == null) {
      this.error = 'No fightId and/or fighterId provided in the route.';
      return;
    }

    this.fightId = Number(fightIdParam);
    this.fighterId = Number(fighterIdParam);

    if (Number.isNaN(this.fightId) || Number.isNaN(this.fighterId)) {
      this.error = `Invalid route params: fightId=${fightIdParam}, fighterId=${fighterIdParam}`;
      return;
    }

    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.error = null;

    const statType = this.selectedStatType ?? undefined;

    this.statService
      .getStatsForFightAndFighter(this.fightId, this.fighterId, statType)
      .subscribe({
        next: (stats) => {
          this.stats = stats;
          this.isLoading = false;
        },
        error: (err) => {
          const msg = `Could not load stats for fight ${this.fightId} and fighter ${this.fighterId}`;
          this.error = msg;
          this.isLoading = false;
          console.error(msg, err);
        }
      });
  }
}
