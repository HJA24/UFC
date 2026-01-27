import { Component, input, output, signal, effect } from '@angular/core';

export type NetworkTabType = 'data' | 'properties';

@Component({
  selector: 'app-network-tabs',
  standalone: true,
  imports: [],
  templateUrl: './network-tabs.component.html',
  styleUrl: './network-tabs.component.scss',
})
export class NetworkTabsComponent {
  activeTab = input<NetworkTabType>('data');
  tabChange = output<NetworkTabType>();

  activeIndex = signal(0);

  constructor() {
    effect(() => {
      this.activeIndex.set(this.activeTab() === 'data' ? 0 : 1);
    });
  }

  select(index: number): void {
    if (this.activeIndex() === index) return;

    this.activeIndex.set(index);
    const tab: NetworkTabType = index === 0 ? 'data' : 'properties';
    this.tabChange.emit(tab);
  }
}
