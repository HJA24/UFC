import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from "@angular/material/icon";

import { FightDto } from "../../../models/fight.dto";

@Component({
  selector: 'app-fight-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './fight-card.component.html',
  styleUrls: ['./fight-card.component.css'],
})
export class FightCardComponent {
  private router = inject(Router);

  @Input({ required: true }) fight!: FightDto;
  @Input({ required: true }) eventId!: string;
  @Input({ required: true }) fightCard!: string;

  openFight(tab: string = 'stats'): void {
    this.router.navigate([
      '/events', this.eventId, this.fightCard, 'fights', this.fight.fightId, tab
    ]);
  }
}
