import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { EventCardComponent } from '../cards/event/event-card.component';
import type { EventDto } from '../../models/event.dto';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [
    CommonModule,
    EventCardComponent
  ],
  templateUrl: './event-list.component.html',
  styleUrls: ['./event-list.component.css'],
})
export class EventListComponent {
  @Input({ required: true }) events!: EventDto[];
}
