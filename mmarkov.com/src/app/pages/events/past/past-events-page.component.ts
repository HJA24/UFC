import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EventsCollectionComponent } from '../../../components/collections/events/events-collection.component';
import { EventsService } from "../../../services/events.service";

@Component({
  selector: 'app-past-events-page',
  standalone: true,
  imports: [
    CommonModule,
    EventsCollectionComponent
  ],
  templateUrl: './past-events-page.component.html',
  styleUrl: './past-events-page.component.css',
})
export class PastEventsPageComponent {
  events$ = this.eventsService.getPastEvents();

  constructor(private eventsService: EventsService) {}
}

