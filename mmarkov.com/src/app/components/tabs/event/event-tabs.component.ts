import { Component, input, output, signal, effect } from '@angular/core';

export type EventTabType = 'upcoming' | 'historical';

@Component({
  selector: 'app-event-tabs',
  standalone: true,
  imports: [],
  templateUrl: './event-tabs.component.html',
  styleUrl: './event-tabs.component.scss',
})
export class EventTabsComponent {
  activeTab = input<EventTabType>('upcoming');
  tabChange = output<EventTabType>();

  activeIndex = signal(0);

  constructor() {
    effect(() => {
      this.activeIndex.set(this.activeTab() === 'upcoming' ? 0 : 1);
    });
  }

  select(index: number): void {
    if (this.activeIndex() === index) return;

    this.activeIndex.set(index);
    const tab: EventTabType = index === 0 ? 'upcoming' : 'historical';
    this.tabChange.emit(tab);
  }
}
