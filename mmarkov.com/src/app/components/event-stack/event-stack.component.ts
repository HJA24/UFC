import { Component, Input, Output, EventEmitter, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import type { EventDto } from '../../models/event.dto';

@Component({
  selector: 'app-event-stack',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './event-stack.component.html',
  styleUrls: ['./event-stack.component.css'],
})
export class EventStackComponent {
  @Input({ required: true }) events!: EventDto[];
  @Output() eventSelected = new EventEmitter<EventDto>();

  currentIndex = signal(0);

  current = computed(() => this.events[this.currentIndex()]);

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

  onCardClick(event: EventDto): void {
    this.eventSelected.emit(event);
  }
}
