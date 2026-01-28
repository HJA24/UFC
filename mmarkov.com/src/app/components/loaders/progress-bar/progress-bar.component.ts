import {Component, input, signal, computed, effect} from '@angular/core'
import {CommonModule} from '@angular/common'
import {
  MatProgressBarModule,
  ProgressAnimationEnd,
} from '@angular/material/progress-bar'

import {Corner} from "../../../models/corner";


@Component({
  selector: 'app-progress-bar',
  standalone: true,
  imports: [
    CommonModule,
    MatProgressBarModule
  ],
  templateUrl: './progress-bar.component.html',
  styleUrl: './progress-bar.component.css',
})
export class ProgressBarComponent {
  corner = input<Corner>('BLUE')
  loading = input<boolean>(false)

  // internal gate: only show the final determinate bar after a clean animation boundary
  private readyToFinalize = signal(false)
  private finalizeTimer: number | null = null

  constructor() {
    effect(() => {
      // when loading restarts, reset
      if (this.loading()) {
        this.readyToFinalize.set(false)
        if (this.finalizeTimer !== null) {
          window.clearTimeout(this.finalizeTimer)
          this.finalizeTimer = null
        }
      } else {
        // loading finished: if animationEnd doesn't fire for any reason, finalize anyway
        if (!this.readyToFinalize()) {
          this.finalizeTimer = window.setTimeout(() => {
            this.readyToFinalize.set(true)
            this.finalizeTimer = null
          }, 50)
        }
      }
    })
  }

  mode = computed<'query' | 'indeterminate' | 'determinate'>(() => {
    if (this.loading()) {
      return this.corner() === 'BLUE' ? 'query' : 'indeterminate'
    }
    // loading finished: wait until we observe an animationEnd on the animated bar
    return this.readyToFinalize() ? 'determinate' : (this.corner() === 'BLUE' ? 'query' : 'indeterminate')
  })

  value = computed<number>(() => (this.mode() === 'determinate' ? 100 : 0))

  onAnimationEnd(_: ProgressAnimationEnd) {
    if (!this.loading()) {
      this.readyToFinalize.set(true)
      if (this.finalizeTimer !== null) {
        window.clearTimeout(this.finalizeTimer)
        this.finalizeTimer = null
      }
    }
  }
}
