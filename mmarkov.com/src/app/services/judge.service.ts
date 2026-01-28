import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Judge } from '../judges/models/judge';

@Injectable({
  providedIn: 'root'
})
export class JudgeService {

  private baseUrl = 'http://localhost:8080/api/judges';

  constructor(private http: HttpClient) {}

  getJudges(): Observable<Judge[]> {
    return this.http.get<Judge[]>(this.baseUrl);
  }
}
