import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { StatsDto } from "../models/stats/stats.dto";

@Injectable({
  providedIn: 'root',
})
export class StatsService {
    private http = inject(HttpClient);

    getFightStats(fightId: number): Observable<StatsDto> {
      return this.http.get<StatsDto>(`/api/fights/${fightId}/stats`);
  }
}
