import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { EventCardComponent } from '../cards/event/event-card.component';
import type { EventDto } from '../../models/event.dto';

@Component({
  selector: 'app-event-stack',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    EventCardComponent
  ],
  templateUrl: './event-stack.component.html',
  styleUrls: ['./event-stack.component.css'],
})
export class EventStackComponent {
  @Input({ required: true }) events!: EventDto[];

  currentIndex = signal(0);

  next(): void {
    if (this.currentIndex() < this.events.length - 1) {
      this.currentIndex.update(i => i + 1);
    }
  }

  prev(): void {
    if (this.currentIndex() > 0) {
      this.currentIndex.update(i => i - 1);
    }
  }

  select(index: number): void {
    this.currentIndex.set(index);
  }
}
