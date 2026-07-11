import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@domain/entities/user';
import { LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '@application/dto/auth/auth.dto';

export interface AuthRepository {
  login(payload: LoginRequest): Observable<User>;
  register(payload: RegisterRequest): Observable<User>;
  verify(payload: VerificationRequest): Observable<void>;
  forgotPassword(payload: ForgotPasswordRequest): Observable<void>;
  resendVerificationCode(email: string): Observable<void>;
  refresh(): Observable<User>;
  getCurrentUser(): Observable<User>;
}

export const AUTH_REPOSITORY_TOKEN = new InjectionToken<AuthRepository>('AUTH_REPOSITORY_TOKEN');
