import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ScorecardsDto } from '../../models/scorecards.dto';

@Injectable({
  providedIn: 'root'
})
export class ScorecardService {

  private readonly baseUrl = '/api';

  constructor(private http: HttpClient) {}

  /**
   * GET /api/fights/{fightId}/scorecards?judgeId=...
   */
  getScorecardsForFightAndJudge(
    fightId: number,
    judgeId: number
  ): Observable<ScorecardsDto> {
    const params = new HttpParams().set('judgeId', judgeId.toString());

    return this.http.get<ScorecardsDto>(
      `${this.baseUrl}/fights/${fightId}/scorecards`,
      { params }
    );
  }
}
