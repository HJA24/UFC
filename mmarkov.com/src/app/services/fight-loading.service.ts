import { Injectable, computed, signal } from '@angular/core'

@Injectable({ providedIn: 'root' })
export class FightLoadingService {
  private pending = signal(0)

  readonly loading = computed(() => this.pending() > 0)

  start(): void {
    this.pending.update(n => n + 1)
  }

  stop(): void {
    this.pending.update(n => Math.max(0, n - 1))
  }

}
