import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule, NavigationEnd } from "@angular/router";
import { filter } from 'rxjs/operators';

type FightTab = 'network' | 'stats' | 'predictions' | 'judging';

const TAB_ORDER: FightTab[] = ['network', 'stats', 'predictions', 'judging'];

@Component({
  selector: 'app-fight-tabs',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './fight-tabs.component.html',
  styleUrl: './fight-tabs.component.scss',
})
export class FightTabsComponent {
  private router = inject(Router);

  activeIndex = signal(0);

  constructor() {
    this.updateActiveIndex(this.router.url);

    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.updateActiveIndex(event.urlAfterRedirects);
      });
  }

  private updateActiveIndex(url: string): void {
    const index = TAB_ORDER.findIndex(tab => url.includes(`/${tab}`));
    if (index !== -1) {
      this.activeIndex.set(index);
    }
  }
}
