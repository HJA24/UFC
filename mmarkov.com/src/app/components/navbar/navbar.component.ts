import { Component, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterLink } from "@angular/router";
import { TiersService } from "../../services/tiers.service";

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
export class NavbarComponent {
  private router = inject(Router);
  private tiersService = inject(TiersService);

  eventsMenuOpen = signal(false);
  tiersMenuOpen = signal(false);

  navigateToTier(index: number): void {
    this.tiersService.selectTier(index);
    this.router.navigate(['/tiers']);
  }
}

