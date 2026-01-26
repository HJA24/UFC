import { Component, signal } from '@angular/core';
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
export class NavbarComponent {
  eventsMenuOpen = signal(false);
  tiersMenuOpen = signal(false);
}

