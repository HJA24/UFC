import { ApplicationConfig, inject } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ViewTransitionService } from './services/view-transition.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withViewTransitions({
      onViewTransitionCreated: ({ transition, from, to }) => {
        const viewTransitionService = inject(ViewTransitionService);
        transition.finished.then(() => {
          // Clean up the transitioning class
          document.body.classList.remove('fight-card-transitioning');
          viewTransitionService.notifyFinished();
        });
      }
    })),
    provideAnimations()
  ]
};
