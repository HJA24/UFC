import { Component, Input, HostBinding } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
    RouterModule,
    MatCardModule,
    MatDividerModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './fight-card.component.html',
  styleUrls: ['./fight-card.component.css'],
})
export class FightCardComponent {
  @Input({ required: true }) fight!: FightDto;
  @Input({ required: true }) eventId!: string;
  @Input({ required: true }) fightCard!: string;

  @HostBinding('class.transitioning') isTransitioning = false;

  onCardClick(): void {
    // Mark this card as the one transitioning
    this.isTransitioning = true;

    // Remove view-transition-name from ALL other cards' elements
    document.querySelectorAll('app-fight-card:not(.transitioning)').forEach(card => {
      card.querySelectorAll('[style*="view-transition-name"]').forEach(el => {
        (el as HTMLElement).style.viewTransitionName = 'none';
      });
    });
  }

  get cardTransitionName(): string {
    return `fight-card-${this.fight.fightId}`;
  }

  get blueTransitionName(): string {
    return `fighter-blue-${this.fight.fightId}`;
  }

  get redTransitionName(): string {
    return `fighter-red-${this.fight.fightId}`;
  }

  get dividerTransitionName(): string {
    return `progress-bar-${this.fight.fightId}`;
  }
}
