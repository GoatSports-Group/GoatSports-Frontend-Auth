import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseResponse } from '@application/dto/base/base-response';
import { User } from '@domain/entity/user';
import { LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '@application/dto/auth/auth.dto';

export interface AuthRepository {
  login(payload: LoginRequest): Observable<BaseResponse<User>>;
  loginWithKeycloak(payload: { code: string; redirectUri: string }): Observable<BaseResponse<User>>;
  register(payload: RegisterRequest): Observable<BaseResponse<User>>;
  verify(payload: VerificationRequest): Observable<BaseResponse<void>>;
  forgotPassword(payload: ForgotPasswordRequest): Observable<any>;
  resendVerificationCode(email: string): Observable<any>;
  logout(): Observable<BaseResponse<void>>;
  refresh(): Observable<BaseResponse<User>>;
  getCurrentUser(): Observable<BaseResponse<User>>;
}

export const AUTH_REPOSITORY_TOKEN = new InjectionToken<AuthRepository>('AUTH_REPOSITORY_TOKEN');
