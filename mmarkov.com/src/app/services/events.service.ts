import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, map, shareReplay } from 'rxjs';

import { EventDto } from '../models/event.dto';
import { FightDto } from '../models/fight.dto';

export interface AllEvents {
  upcoming: EventDto[];
  historical: EventDto[];
}

export type AllFightsForEvent = {
  'early-prelim': FightDto[];
  'prelim': FightDto[];
  'main': FightDto[];
};

@Injectable({
  providedIn: 'root'
})
export class EventsService {
  private baseUrl = '/api/events';
  private allEvents$: Observable<AllEvents> | null = null;
  private allFightsCache = new Map<string, Observable<AllFightsForEvent>>();

  constructor(private http: HttpClient) {}

  /** GET all events (cached) */
  getAllEvents(): Observable<AllEvents> {
    if (!this.allEvents$) {
      this.allEvents$ = forkJoin({
        upcoming: this.http.get<EventDto[]>(`${this.baseUrl}/upcoming`),
        historical: this.http.get<EventDto[]>(`${this.baseUrl}/historical`)
      }).pipe(shareReplay(1));
    }
    return this.allEvents$;
  }

  /** GET /api/events/upcoming */
  getUpcomingEvents(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/upcoming`);
  }

  /** GET /api/events/historical */
  getPastEvents(): Observable<EventDto[]> {
    return this.http.get<EventDto[]>(`${this.baseUrl}/historical`);
  }

  /** GET /api/events/{eventId}/{fightCard}/fights */
  getFightsOfEventByFightCard(eventId: string, fightCard: string) {
    return this.http.get<FightDto[]>(`${this.baseUrl}/${eventId}/${fightCard}/fights`);
  }

  /** GET all fights for an event grouped by fightcard (cached) */
  getAllFightsForEvent(eventId: string): Observable<AllFightsForEvent> {
    if (!this.allFightsCache.has(eventId)) {
      const fights$ = forkJoin({
        'early-prelim': this.http.get<FightDto[]>(`${this.baseUrl}/${eventId}/EARLY_PRELIM/fights`),
        'prelim': this.http.get<FightDto[]>(`${this.baseUrl}/${eventId}/PRELIM/fights`),
        'main': this.http.get<FightDto[]>(`${this.baseUrl}/${eventId}/MAIN/fights`)
      }).pipe(shareReplay(1));
      this.allFightsCache.set(eventId, fights$);
    }
    return this.allFightsCache.get(eventId)!;
  }
}
