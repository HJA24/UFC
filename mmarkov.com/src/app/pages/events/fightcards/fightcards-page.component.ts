import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterOutlet } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

import { FightcardTabsComponent } from '../../../components/tabs/fightcard/fightcard-tabs.component';
import { FightListComponent } from '../../../components/fight-list/fight-list.component';
import { EventsService, AllFightsForEvent } from '../../../services/events.service';
import { FightDto } from '../../../models/fight.dto';

export type FightcardTab = 'early-prelim' | 'prelim' | 'main';

const VALID_TABS: FightcardTab[] = ['early-prelim', 'prelim', 'main'];

@Component({
  selector: 'app-fightcards-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatFormFieldModule,
    MatInputModule,
    FightcardTabsComponent,
    FightListComponent
  ],
  templateUrl: './fightcards-page.component.html',
  styleUrl: './fightcards-page.component.scss',
})
export class FightcardsPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private eventsService = inject(EventsService);

  activeTab = signal<FightcardTab>('main');
  allFights = signal<AllFightsForEvent | null>(null);
  searchQuery = signal<string>('');
  isLoading = true;
  eventId = '';

  activeFights = computed<FightDto[]>(() => {
    const fights = this.allFights();
    if (!fights) return [];

    const list = fights[this.activeTab()] ?? [];
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return list;

    return list.filter(fight => {
      const blueFirst = fight.fighterBlue.firstName.toLowerCase();
      const blueLast = fight.fighterBlue.lastName.toLowerCase();
      const redFirst = fight.fighterRed.firstName.toLowerCase();
      const redLast = fight.fighterRed.lastName.toLowerCase();

      return blueFirst.includes(query) ||
             blueLast.includes(query) ||
             redFirst.includes(query) ||
             redLast.includes(query);
    });
  });

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
      this.allFights.set(fights);
      this.isLoading = false;
    });
  }

  onTabChange(tab: FightcardTab): void {
    this.searchQuery.set('');
    this.router.navigate(['/events', this.eventId, tab]);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}
