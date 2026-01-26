import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ViewTransitionService {
  private transitionFinished$ = new Subject<void>();

  /** Emits when the current view transition completes */
  readonly finished$ = this.transitionFinished$.asObservable();

  /** Called by app.config when transition finishes */
  notifyFinished(): void {
    this.transitionFinished$.next();
  }
}
