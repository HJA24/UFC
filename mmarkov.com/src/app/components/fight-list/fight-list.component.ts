import { Component, Input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

import { FightCardComponent } from '../cards/fight/fight-card.component';
import type { FightDto } from '../../models/fight.dto';

@Component({
  selector: 'app-fight-list',
  standalone: true,
  imports: [
    CommonModule,
    FightCardComponent
  ],
  templateUrl: './fight-list.component.html',
  styleUrls: ['./fight-list.component.css'],
})
export class FightListComponent {
  @Input({ required: true }) fights!: FightDto[];
  @Input({ required: true }) eventId!: string;
  @Input({ required: true }) fightCard!: string;

  expandedFightId = signal<number | null>(null);

  toggleFight(fightId: number): void {
    if (this.expandedFightId() === fightId) {
      this.expandedFightId.set(null);
    } else {
      this.expandedFightId.set(fightId);
    }
  }

  isExpanded(fightId: number): boolean {
    return this.expandedFightId() === fightId;
  }
}
