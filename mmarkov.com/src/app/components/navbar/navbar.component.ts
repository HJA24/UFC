import { Component, OnInit, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink, NavigationEnd } from "@angular/router";
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-navbar',
    imports: [
        MatToolbarModule,
        MatButtonModule,
        MatIconModule,
        MatDividerModule,
        MatMenuModule,
        RouterLink
    ],
    templateUrl: './navbar.component.html',
    styleUrls: ['./navbar.component.css']
})
export class NavbarComponent implements OnInit {
  private router = inject(Router);

  private isAnimationBlocked = signal(true); // Blocks new animations during any running animation
  isLogoReady = signal(false); // Controls the .ready class (static expanded state)
  isHoverAnimating = signal(false); // Controls the .animating class for hover animation
  isVisible = signal(true);

  ngOnInit(): void {
    // Initial animation: 1s delay + 2s duration = 3s
    setTimeout(() => {
      this.isLogoReady.set(true);
      this.isAnimationBlocked.set(false);
    }, 3000);

    // Check initial route
    this.checkNavbarVisibility();

    // Listen to route changes
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.checkNavbarVisibility();
    });
  }

  private checkNavbarVisibility(): void {
    let route = this.router.routerState.root;
    let hideNavbar = false;

    // Check entire route hierarchy for hideNavbar
    while (route) {
      if (route.snapshot.data['hideNavbar']) {
        hideNavbar = true;
        break;
      }
      route = route.firstChild!;
    }

    this.isVisible.set(!hideNavbar);
  }

  onLogoHover(): void {
    if (this.isAnimationBlocked()) return;

    this.isAnimationBlocked.set(true);
    this.isHoverAnimating.set(true);
  }

  onLogoAnimationEnd(): void {
    this.isHoverAnimating.set(false);
    this.isAnimationBlocked.set(false);
  }
}

