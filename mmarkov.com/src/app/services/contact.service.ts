import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { ContactRequestDto } from "../models/contact.dto";

@Injectable({
  providedIn: 'root',
})
export class ContactService {
    constructor(private http: HttpClient) {}
    contact(request: ContactRequestDto): Observable<void> {
      return this.http.post<void>(
        '/api/contact-us',
        request
    );
  }

}
