import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface PendingVerificationEmailResponseDto {
  email: string;
}

@Injectable({
  providedIn: 'root',
})
export class EmailService {
  constructor(private http: HttpClient) {}

  getPendingVerificationEmail(): Observable<PendingVerificationEmailResponseDto> {
    return this.http.get<PendingVerificationEmailResponseDto>(
      '/api/auth/pending-verification'
    );
  }

  resendVerificationEmail(): Observable<void> {
    return this.http.post<void>(
      '/api/auth/resend-verification',
      {}
    );
  }
}
