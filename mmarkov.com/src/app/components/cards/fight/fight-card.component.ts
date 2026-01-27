import { Component, Input } from '@angular/core';
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


  get cardContainerTransition(): string {
    return `fight-card-${this.fight.fightId}`;
  }

  get fighterNameBlueTransition(): string {
    return `fighter-blue-${this.fight.fightId}`;
  }

  get fighterNameRedTransition(): string {
    return `fighter-red-${this.fight.fightId}`;
  }

  get dividerTransition(): string {
    return `progress-bar-${this.fight.fightId}`;
  }
}
