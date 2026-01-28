import {Component, inject, OnInit, HostBinding} from '@angular/core';
import {RouterOutlet, ActivatedRoute, Router} from "@angular/router";
import {CommonModule} from "@angular/common";
import {finalize} from "rxjs";
import {trigger, transition, style, animate} from '@angular/animations';

import {MatIconModule} from "@angular/material/icon";
import {MatButtonModule} from "@angular/material/button";

import {FightDto} from "../../models/fight.dto";
import {FightService} from "../../services/fight.service";
import {FightTabsComponent} from "../../components/tabs/fight/fight-tabs.component";
import {DualProgressBarComponent} from "../../components/loaders/dual-progress-bar/dual-progress-bar.component";
import {FightLoadingService} from '../../services/fight-loading.service';


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
  animations: [
    trigger('overlay', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('400ms ease-out', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class FightPageComponent implements OnInit {
  @HostBinding('@overlay') animateOverlay = true;

  private route = inject(ActivatedRoute)
  private router = inject(Router)
  private fightService = inject(FightService)
  loadingService = inject(FightLoadingService)

  fight: FightDto | null = null;
  private fightId = this.route.snapshot.paramMap.get('fightId');

  ngOnInit() {
    this.loadFight();
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
    // Navigate to parent (fightcards page)
    this.router.navigate(['../..'], { relativeTo: this.route });
  }
}
