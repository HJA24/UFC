import { Component, signal, computed } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EventTabsComponent, EventTabType } from '../../components/tabs/event/event-tabs.component';
import { EventListComponent } from '../../components/event-list/event-list.component';
import { EventsService, AllEvents } from '../../services/events.service';
import { EventDto } from '../../models/event.dto';

@Component({
  selector: 'app-events-page',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    EventTabsComponent,
    EventListComponent
  ],
  templateUrl: './events-page.component.html',
  styleUrl: './events-page.component.scss',
})
export class EventsPageComponent {
  activeTab = signal<EventTabType>('upcoming');
  allEvents = signal<AllEvents | null>(null);
  searchQuery = signal<string>('');

  events = computed<EventDto[]>(() => {
    const data = this.allEvents();
    if (!data) return [];

    const tab = this.activeTab();
    const list = tab === 'upcoming' ? data.upcoming : data.historical;
    const query = this.searchQuery().toLowerCase().trim();

    if (!query) return list;
    return list.filter(event => event.name.toLowerCase().includes(query));
  });

  constructor(
    private eventsService: EventsService,
    private route: ActivatedRoute,
    private location: Location
  ) {
    // Set initial tab from route data
    const tabFromRoute = this.route.snapshot.data['tab'] as EventTabType;
    if (tabFromRoute) {
      this.activeTab.set(tabFromRoute);
    }

    this.eventsService.getAllEvents().subscribe((events) => {
      this.allEvents.set(events);
    });
  }

  onTabChange(tab: EventTabType): void {
    this.activeTab.set(tab);
    this.searchQuery.set('');
    // Update URL without navigation
    const path = tab === 'upcoming' ? '/events/upcoming' : '/events/historical';
    this.location.replaceState(path);
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.searchQuery.set(value);
  }
}
