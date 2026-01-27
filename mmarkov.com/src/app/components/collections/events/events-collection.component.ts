import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { EventStackComponent } from '../../event-stack/event-stack.component';
import { EventListComponent } from '../../event-list/event-list.component';
import type { EventDto } from '../../../models/event.dto';

type ViewMode = 'list' | 'stack';

@Component({
  selector: 'app-events-collection',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    EventStackComponent,
    EventListComponent
  ],
  templateUrl: './events-collection.component.html',
  styleUrls: ['./events-collection.component.css'],
})
export class EventsCollectionComponent {
  @Input({ required: true }) events!: EventDto[];

  viewMode = signal<ViewMode>('stack');

  setViewMode(mode: ViewMode): void {
    this.viewMode.set(mode);
  }
}
