import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {EventService} from '../../services/event.service';
import {FightDto} from '../../models/fight.dto';

@Component({
    selector: 'app-fights',
    templateUrl: './fights.component.html',
    styleUrls: ['./fights.component.scss'],
    standalone: false
})
export class FightsComponent implements OnInit {
  eventId!: number;
  fightsMain: FightDto[] = [];
  fightsPrelim: FightDto[] = [];
  fightsEarlyPrelim: FightDto[] = [];

  isLoading = false;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private eventService: EventService
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('eventId');
    if (idParam == null) {
      this.error = 'No eventId provided in route'
      return;
    }

    this.eventId = Number(idParam);
    if (Number.isNaN(this.eventId)) {
      this.error = `Invalid eventId: ${idParam}`;
      return;
    }

    this.loadFights();
  }

  private loadFights(): void {
    this.isLoading = true;
    this.error = null;

    this.eventService.getFightsOfEvent(this.eventId).subscribe({
      "next": (fights) => {
        this.fightsMain = fights.filter(f => f.fightCard === 'MAIN');
        this.fightsPrelim = fights.filter(f => f.fightCard === "PRELIM");
        this.fightsEarlyPrelim = fights.filter(f => f.fightCard === "EARLY_PRELIM");

        this.isLoading = false;
      },
      "error": (err) => {
        const msg = `Could not load fights for event ${this.eventId}`;
        this.error = msg;
        this.isLoading = false;
        console.error(msg, err);
      }
    });
  }
}

