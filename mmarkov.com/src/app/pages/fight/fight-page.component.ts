import {Component, inject, OnInit, OnDestroy, signal} from '@angular/core';
import {RouterOutlet, ActivatedRoute} from "@angular/router";
import {CommonModule, Location} from "@angular/common";
import {finalize, take, Subscription} from "rxjs";

import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

import {FightDto} from "../../models/fight.dto";
import {FightService} from "../../services/fight.service";
import {FightTabsComponent} from "../../components/tabs/fight/fight-tabs.component";
import { DualProgressBarComponent} from "../../components/loaders/dual-progress-bar/dual-progress-bar.component";
import { FightLoadingService } from '../../services/fight-loading.service';
import { ViewTransitionService } from '../../services/view-transition.service';


@Component({
  selector: 'app-fight-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    FightTabsComponent,
    DualProgressBarComponent,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './fight-page.component.html',
  styleUrl: './fight-page.component.css',
})
export class FightPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute)
  private location = inject(Location)
  private fightService = inject(FightService)
  private viewTransitionService = inject(ViewTransitionService)
  loadingService = inject(FightLoadingService)

  private subscription?: Subscription;
  fight: FightDto | null = null;

  // Read fightId immediately so transition names are available on first render
  private fightId = this.route.snapshot.paramMap.get('fightId');
  cardContainerTransition = `fight-card-${this.fightId}`;
  fighterNameBlueTransition = `fighter-blue-${this.fightId}`;
  fighterNameRedTransition = `fighter-red-${this.fightId}`;
  progressBarTransition = `progress-bar-${this.fightId}`;

  // Get fighter names from router state for immediate display during transition
  fighterNameBlue = history.state?.fighterNameBlue ?? '';
  fighterNameRed = history.state?.fighterNameRed ?? '';

  // Content visibility - hidden during transition, shown after
  contentVisible = signal(!this.fighterNameBlue); // Visible immediately if direct navigation

  ngOnInit() {
    // If navigated directly (no router state), load immediately
    if (!this.fighterNameBlue) {
      this.loadFight();
      return;
    }

    // Wait for view transition to complete before showing content
    this.subscription = this.viewTransitionService.finished$.pipe(take(1)).subscribe(() => {
      this.contentVisible.set(true);
      this.loadFight();
    });
  }

  ngOnDestroy() {
    this.subscription?.unsubscribe();
  }

  private loadFight() {
    this.loadingService.start();

    this.fightService.getFight(Number(this.fightId)).pipe(
      finalize(() => this.loadingService.stop())
    ).subscribe({
      next: (fight) => {
        this.fight = fight;
      },
      error: (err) => {
        console.error('failed to load fight:', err);
        this.fight = null;
      }
    });
  }

  close(): void {
    this.location.back();
  }
}
