import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AuthApi } from '../api/auth.api';
import { BaseResponse } from '../../domain/entities/base';
import { User, LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '../../domain/entities/user';

@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl implements AuthRepository {
  private authApi = inject(AuthApi);

  login(payload: LoginRequest): Observable<BaseResponse<User>> {
    return this.authApi.login(payload);
  }

  loginWithKeycloak(payload: { code: string; redirectUri: string }): Observable<BaseResponse<User>> {
    return this.authApi.loginWithKeycloak(payload);
  }

  register(payload: RegisterRequest): Observable<BaseResponse<User>> {
    return this.authApi.register(payload);
  }

  verify(payload: VerificationRequest): Observable<BaseResponse<void>> {
    return this.authApi.verify(payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<any> {
    return this.authApi.forgotPassword(payload);
  }

  resendVerificationCode(email: string): Observable<any> {
    return this.authApi.resendVerificationCode(email);
  }

  logout(): Observable<BaseResponse<void>> {
    return this.authApi.logout();
  }

  refresh(): Observable<BaseResponse<User>> {
    return this.authApi.refresh();
  }

  getCurrentUser(): Observable<BaseResponse<User>> {
    return this.authApi.getCurrentUser();
  }
}
