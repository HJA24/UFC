import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FightcardTabsComponent } from '../../../components/tabs/fightcard/fightcard-tabs.component';
import { FightCardComponent } from '../../../components/cards/fight/fight-card.component';
import { EventsService, AllFightsForEvent } from '../../../services/events.service';

export type FightcardTab = 'early-prelim' | 'prelim' | 'main';

const VALID_TABS: FightcardTab[] = ['early-prelim', 'prelim', 'main'];

@Component({
  selector: 'app-fightcards-page',
  standalone: true,
  imports: [
    CommonModule,
    FightcardTabsComponent,
    FightCardComponent
  ],
  templateUrl: './fightcards-page.component.html',
  styleUrl: './fightcards-page.component.css',
})
export class FightcardsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);

  activeTab = signal<FightcardTab>('main');
  eventId = '';
  allFights: AllFightsForEvent | null = null;
  isLoading = true;

  ngOnInit(): void {
    // Get eventId from parent route
    this.eventId = this.route.parent?.snapshot.paramMap.get('eventId') ?? '';

    // Get initial tab from route
    const tab = this.route.snapshot.paramMap.get('fightCard');
    if (tab && VALID_TABS.includes(tab as FightcardTab)) {
      this.activeTab.set(tab as FightcardTab);
    }

    // Subscribe to route changes for tab updates
    this.route.paramMap.subscribe(params => {
      const newTab = params.get('fightCard');
      if (newTab && VALID_TABS.includes(newTab as FightcardTab)) {
        this.activeTab.set(newTab as FightcardTab);
      }
    });

    // Fetch all fights once
    this.eventsService.getAllFightsForEvent(this.eventId).subscribe(fights => {
      this.allFights = fights;
      this.isLoading = false;
    });
  }

  onTabChange(tab: FightcardTab): void {
    this.router.navigate(['/events', this.eventId, tab]);
  }

  get activeFights() {
    return this.allFights?.[this.activeTab()] ?? [];
  }
}
