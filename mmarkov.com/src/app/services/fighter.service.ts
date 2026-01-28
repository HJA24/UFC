import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {Observable} from 'rxjs';
import {FighterDto} from '../models/fighter.dto';

@Injectable({
  providedIn: 'root'
})
export class FighterService {

  private baseUrl = '/api/fighters';

  constructor(private http: HttpClient) {
  }

  /**
   * GET /api/fighters
   * Returns all fighters
   */
  getFighters(): Observable<FighterDto[]> {
    return this.http.get<FighterDto[]>(this.baseUrl);
  }

  /**
   * GET /api/fighters/{fighterId}
   * Returns a single fighter
   */
  getFighter(fighterId: number): Observable<FighterDto> {
    return this.http.get<FighterDto>(`${this.baseUrl}/${fighterId}`);
  }
}

