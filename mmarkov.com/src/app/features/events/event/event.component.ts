import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { EventService } from '../../../services/event.service';
import type { EventDto } from '../../../models/event.dto';
import type { FightDto } from '../../../models/fight.dto';

@Component({
    selector: 'app-event',
    templateUrl: './event.component.html',
    styleUrls: ['./event.component.scss'],
    standalone: false
})
export class EventComponent implements OnInit {
  event: EventDto | null = null;
  fights: FightDto[] = [];

  loading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    const eventId = Number(this.route.snapshot.paramMap.get('eventId'));

    if (Number.isNaN(eventId)) {
      this.error = 'No eventId provided in route'
      return;
    }

    this.loadEvent(eventId);
  }

  private loadEvent(eventId: number): void {
    this.loading = true;

    this.eventService.getEvent(eventId).subscribe({
      next: (event) => {
        this.event = event;
        this.loadEventFights(eventId);
      },
      error: (err) => {
        const msg = `Failed to load event ${eventId}`;
        this.error = msg;
        this.loading = false;
        console.error(msg, err);
      }
    });
  }

  private loadEventFights(eventId: number): void {
    this.eventService.getEventFights(eventId).subscribe({
      next: (fights) => {
        this.fights = fights;
        this.loading = false;
      },
      error: (err) => {
        const msg = `Failed to load fights for event ${eventId}`;
        this.error = msg;
        this.loading = false;
        console.error(msg, err);
      }
    });
  }
}
