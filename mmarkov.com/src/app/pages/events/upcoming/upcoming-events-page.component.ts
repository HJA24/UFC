import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsCollectionComponent } from '../../../components/collections/events/events-collection.component';
import { EventsService } from "../../../services/events.service";

@Component({
  selector: 'app-upcoming-events-page',
  standalone: true,
  imports: [
    CommonModule,
    EventsCollectionComponent
  ],
  templateUrl: './upcoming-events-page.component.html',
  styleUrl: './upcoming-events-page.component.css',
})
export class UpcomingEventsPageComponent {
  events$ = this.eventsService.getUpcomingEvents();

  constructor(private eventsService: EventsService) {}
}
