import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoginRequestDto, LoginResponseDto } from "../models/auth/login.dto";
import { SignupRequestDto } from "../models/auth/signup.dto";
import { VerifyAccountRequestDto, VerifyAccountResponseDto } from "../models/auth/verify-account.dto";
import { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "../models/auth/forgot-password.dto";
import { ResetPasswordRequestDto, ResetPasswordResponseDto } from "../models/auth/reset-password.dto";

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  constructor(private http: HttpClient) {
  }

  login(request: LoginRequestDto): Observable<LoginResponseDto> {
    return this.http.post<LoginResponseDto>(
      '/api/auth/login',
      request
    );
  }

  signup(request: SignupRequestDto): Observable<void> {
    return this.http.post<void>(
      '/api/auth/signup',
      request
    );
  }

  forgotPassword(request: ForgotPasswordRequestDto): Observable<ForgotPasswordResponseDto> {
    return this.http.post<ForgotPasswordResponseDto>(
      '/api/auth/forgot-password',
      request
    );
  }

  resetPassword(request: ResetPasswordRequestDto): Observable<ResetPasswordResponseDto> {
    return this.http.post<ResetPasswordResponseDto>(
      '/api/auth/reset-password',
      request
    );
  }

  verifyAccount(request: VerifyAccountRequestDto): Observable<VerifyAccountResponseDto> {
    return this.http.post<VerifyAccountResponseDto>(
      '/api/auth/verify-account',
      request
    );
  }
}
