import {
  Component,
  DestroyRef,
  computed,
  inject,
  signal
} from '@angular/core';

import { CommonModule } from '@angular/common';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { FIGHT_PAGE_NAV_ITEMS } from '../../../pages/fight/fight-nav.items';

@Component({
  selector: 'app-fight-menu',
  standalone: true,
  imports: [
    CommonModule,     // *ngIf
    MatIconModule,    // <mat-icon>
    MatButtonModule,  // mat-icon-button
  ],
  templateUrl: './fight-menu.component.html',
  styleUrls: ['./fight-menu.component.css'],
})
export class FightMenuComponent {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly navItems = FIGHT_PAGE_NAV_ITEMS;

  /* ---------- state ---------- */
  private readonly activeIndexSig = signal(0);


  readonly activeItem = computed(() =>
    this.navItems[this.activeIndexSig()]
  );

  readonly hasPrev = computed(() =>
    this.activeIndexSig() > 0
  );

  readonly hasNext = computed(() =>
    this.activeIndexSig() < this.navItems.length - 1
  );

  /* ---------- sync with router ---------- */
  private readonly _routeSync = this.router.events
    .pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef)
    )
    .subscribe(() => this.syncWithRoute());

  private syncWithRoute(): void {
    const url = this.router.url;

    const idx = this.navItems.findIndex(item =>
      url.endsWith(`/${item.path}`) || url.includes(`/${item.path}/`)
    );

    if (idx >= 0) {
      this.activeIndexSig.set(idx);
    }
  }

  /* ---------- navigation ---------- */
  prev(): void {
    if (!this.hasPrev()) return;
    this.go(this.activeIndexSig() - 1);
  }

  next(): void {
    if (!this.hasNext()) return;
    this.go(this.activeIndexSig() + 1);
  }

  private go(index: number): void {
    this.router.navigate(
      [this.navItems[index].path],
      { relativeTo: this.route }
    );
  }
}
