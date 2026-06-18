import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseResponse } from '../../domain/entities/base';
import { User, LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '../../domain/entities/user';

@Injectable({
  providedIn: 'root'
})
export class AuthApi {
  private http = inject(HttpClient);
  private apiBase = import.meta.env.NG_APP_API_URL;

  login(payload: LoginRequest): Observable<BaseResponse<User>> {
    return this.http.post<BaseResponse<User>>(
      `${this.apiBase}/auth-service/api/v1/auth/login`,
      payload,
      { withCredentials: true }
    );
  }

  loginWithKeycloak(payload: { code: string; redirectUri: string }): Observable<BaseResponse<User>> {
    return this.http.post<BaseResponse<User>>(
      `${this.apiBase}/auth-service/api/v1/auth/login/keycloak`,
      payload,
      { withCredentials: true }
    );
  }

  register(payload: RegisterRequest): Observable<BaseResponse<User>> {
    return this.http.post<BaseResponse<User>>(
      `${this.apiBase}/auth-service/api/v1/auth/register`,
      payload
    );
  }

  verify(payload: VerificationRequest): Observable<BaseResponse<void>> {
    return this.http.post<BaseResponse<void>>(
      `${this.apiBase}/auth-service/api/v1/auth/verify`,
      payload
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<any> {
    return this.http.put<any>(
      `${this.apiBase}/auth-service/api/v1/auth/forgot-password`,
      payload
    );
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiBase}/auth-service/api/v1/auth/resend`,
      null,
      { params: { email } }
    );
  }

  logout(): Observable<BaseResponse<void>> {
    return this.http.post<BaseResponse<void>>(
      `${this.apiBase}/auth-service/api/v1/auth/logout`,
      {},
      { withCredentials: true }
    );
  }

  refresh(): Observable<BaseResponse<User>> {
    return this.http.get<BaseResponse<User>>(
      `${this.apiBase}/auth-service/api/v1/auth/refresh`,
      { withCredentials: true }
    );
  }

  getCurrentUser(): Observable<BaseResponse<User>> {
    return this.http.get<BaseResponse<User>>(
      `${this.apiBase}/auth-service/api/v1/auth/me`
    );
  }
}
