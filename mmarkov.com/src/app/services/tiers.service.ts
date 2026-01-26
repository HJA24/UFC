import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TiersService {
  readonly selectedIndex = signal(1); // Default to Lightweight

  selectTier(index: number): void {
    this.selectedIndex.set(index);
  }
}
