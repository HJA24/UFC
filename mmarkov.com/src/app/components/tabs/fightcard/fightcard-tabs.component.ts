import { Component, inject, signal } from '@angular/core';
import { Router, RouterModule, ActivatedRoute, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';

type FightcardTab = 'early-prelim' | 'prelim' | 'main';

const TAB_ORDER: FightcardTab[] = ['early-prelim', 'prelim', 'main'];

@Component({
  selector: 'app-fightcard-tabs',
  standalone: true,
  imports: [RouterModule],
  templateUrl: './fightcard-tabs.component.html',
  styleUrl: './fightcard-tabs.component.scss',
})
export class FightcardTabsComponent {
  private router = inject(Router);
  readonly route = inject(ActivatedRoute);

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
    const index = TAB_ORDER.findIndex(tab => url.includes(`/${tab}/`));
    if (index !== -1) {
      this.activeIndex.set(index);
    }
  }
}
