import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { FightDto } from '../models/fight.dto';


@Injectable({
  providedIn: 'root'
})
export class FightService {

  private readonly baseUrl = '/api/fights';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/fights/{fightId}
   */
  getFight(fightId: number): Observable<FightDto> {
    return this.http.get<FightDto>(`${this.baseUrl}/${fightId}`);
  }
}
