import {Component, inject, OnInit, OnDestroy} from '@angular/core';
import {RouterOutlet, ActivatedRoute} from "@angular/router";
import {CommonModule} from "@angular/common";
import {finalize, take, Subscription} from "rxjs";

import {FightDto} from "../../models/fight.dto";
import {FightService} from "../../services/fight.service";
import {FightTabsComponent} from "../../components/tabs/fight/fight-tabs.component";
import { DualProgressBarComponent} from "../../components/loaders/dual-progress-bar/dual-progress-bar.component";
import { FightMenuComponent } from "../../components/menus/fight-menu/fight-menu.component";
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
    FightMenuComponent
  ],
  templateUrl: './fight-page.component.html',
  styleUrl: './fight-page.component.css',
})
export class FightPageComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute)
  private fightService = inject(FightService)
  private viewTransitionService = inject(ViewTransitionService)
  loadingService = inject(FightLoadingService)

  private subscription?: Subscription;
  fight: FightDto | null = null;

  // Read fightId immediately so transition names are available on first render
  private fightId = this.route.snapshot.paramMap.get('fightId');
  cardTransitionName = `fight-card-${this.fightId}`;
  blueTransitionName = `fighter-blue-${this.fightId}`;
  redTransitionName = `fighter-red-${this.fightId}`;
  progressBarTransitionName = `progress-bar-${this.fightId}`;

  // Get fighter names from router state for immediate display during transition
  blueName = history.state?.blueName ?? '';
  redName = history.state?.redName ?? '';

  ngOnInit() {
    // If navigated directly (no router state), load immediately
    if (!this.blueName) {
      this.loadFight();
      return;
    }

    // Wait for view transition to complete before loading data
    this.subscription = this.viewTransitionService.finished$.pipe(
      take(1)
    ).subscribe(() => {
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
}
