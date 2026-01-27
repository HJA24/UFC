import { Component, inject } from '@angular/core';
import { CommonModule } from "@angular/common";
import { ActivatedRoute } from '@angular/router';
import { combineLatest, switchMap } from 'rxjs';

import { EventsService } from '../../../services/events.service';
import { FightCardComponent } from "../../../components/cards/fight/fight-card.component";

@Component({
  selector: 'app-fights-page',
  standalone: true,
  templateUrl: './fights-page.component.html',
  styleUrls: ['./fights-page.component.css'],
  imports: [
    CommonModule,
    FightCardComponent
  ]
})
export class FightsPageComponent {
  private route = inject(ActivatedRoute);
  private eventsService = inject(EventsService);

  eventId = '';
  fightCard = '';

  fights$ = combineLatest([
    this.route.parent!.paramMap,
    this.route.paramMap
  ]).pipe(
    switchMap(([parentPm, pm]) => {
      this.eventId = parentPm.get('eventId') ?? '';
      this.fightCard = pm.get('fightCard') ?? '';

      return this.eventsService.getFightsOfEventByFightCard(this.eventId, this.fightCard);
    })
  );
}
