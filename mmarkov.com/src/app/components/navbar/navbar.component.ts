import { Component, OnInit, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink } from "@angular/router";

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
  private isAnimationBlocked = signal(true);
  isLogoReady = signal(false);
  isHoverAnimating = signal(false);

  ngOnInit(): void {
    // Initial animation: 1s delay + 2s duration = 3s
    setTimeout(() => {
      this.isLogoReady.set(true);
      this.isAnimationBlocked.set(false);
    }, 3000);
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

