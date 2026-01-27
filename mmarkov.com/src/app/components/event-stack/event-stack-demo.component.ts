import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DemoEvent {
  id: number;
  name: string;
  date: string;
  venue: string;
}

@Component({
  selector: 'app-event-stack-demo',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './event-stack-demo.component.html',
  styleUrls: ['./event-stack-demo.component.css'],
})
export class EventStackDemoComponent {
  events: DemoEvent[] = [
    { id: 1, name: 'UFC 325', date: 'Apr 12, 2025', venue: 'Las Vegas' },
    { id: 2, name: 'UFC 326', date: 'Apr 19, 2025', venue: 'Miami' },
    { id: 3, name: 'UFC 327', date: 'Apr 26, 2025', venue: 'Toronto' },
    { id: 4, name: 'UFC 328', date: 'May 3, 2025', venue: 'London' },
    { id: 5, name: 'UFC 329', date: 'May 10, 2025', venue: 'Abu Dhabi' },
  ];

  // For accordion
  expandedIndex: number | null = 0;

  // For swipeable
  currentIndex = 0;

  // For dismissed card demos
  demoIndices = {
    fadeBack: 0,
    slideUnder: 0,
    shrink: 0,
    greyTrail: 0,
    softRecede: 0
  };

  nextDemo(demo: keyof typeof this.demoIndices): void {
    if (this.demoIndices[demo] < this.events.length - 1) {
      this.demoIndices[demo]++;
    }
  }

  prevDemo(demo: keyof typeof this.demoIndices): void {
    if (this.demoIndices[demo] > 0) {
      this.demoIndices[demo]--;
    }
  }

  resetDemo(demo: keyof typeof this.demoIndices): void {
    this.demoIndices[demo] = 0;
  }

  toggleAccordion(index: number): void {
    this.expandedIndex = this.expandedIndex === index ? null : index;
  }

  nextCard(): void {
    this.currentIndex = (this.currentIndex + 1) % this.events.length;
  }

  prevCard(): void {
    this.currentIndex = (this.currentIndex - 1 + this.events.length) % this.events.length;
  }
}
