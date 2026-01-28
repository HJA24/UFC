import { Component, OnInit } from '@angular/core';

import { EventsService } from '../../../services/events.service';
import type { EventDto } from '../../../models/event.dto';

@Component({
    selector: 'app-events',
    templateUrl: './events.component.html',
    styleUrls: ['./events.component.scss'],
    standalone: false
})
export class EventsComponent implements OnInit {
  upcoming: EventDto | null = null;
  historical: EventDto[] = [];

  loading = false;
  error: string | null = null;

  constructor(private eventsService: EventsService) {}

  ngOnInit(): void {
    this.loadEvents();
  }

  private loadEvents(): void {
    this.loading = true;

    this.eventsService.getUpcomingEvent().subscribe({
      next: (event) => this.upcoming = event,
      error: (err) => {
        const msg =  'Failed to load upcoming event(s)';
        this.error = msg;
        this.loading = false;
        console.error(msg, err);
      }
    });

    this.eventsService.getHistoricalEvents().subscribe({
      next: (events) => {
        this.historical = events;
        this.loading = false;
      },
      error: (err) => {
        const msg = 'Failed to load historical events';
        this.error = msg;
        this.loading = false;
        console.error(msg, err);
      }
    });
  }
}
