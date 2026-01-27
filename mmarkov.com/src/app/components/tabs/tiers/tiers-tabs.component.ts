import { Component, ElementRef, inject, input, output, signal, effect } from '@angular/core';

@Component({
  selector: 'app-tiers-tabs',
  standalone: true,
  imports: [],
  templateUrl: './tiers-tabs.component.html',
  styleUrl: './tiers-tabs.component.scss',
})
export class TiersTabsComponent {
  private elementRef = inject(ElementRef);

  selectedIndex = input<number>(0);
  selectedIndexChange = output<number>();

  activeIndex = signal(0);

  constructor() {
    effect(() => {
      this.activeIndex.set(this.selectedIndex());
    });
  }

  select(index: number): void {
    if (this.activeIndex() === index) return;

    this.activeIndex.set(index);
    this.selectedIndexChange.emit(index);

    this.elementRef.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
