import { Injectable, inject } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

import { NetworkDto } from "../models/network/network.dto";


@Injectable({
  providedIn: 'root',
})
export class NetworkService {
  private http = inject(HttpClient)

  getNetwork(fightId: number): Observable<NetworkDto> {
    return this.http.get<NetworkDto>(`/api/fights/${fightId}/network`);
  }
}
