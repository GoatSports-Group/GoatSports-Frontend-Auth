import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseResponse } from '@application/dto/base/base-response';
import { User } from '@domain/entity/user';
import { LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '@application/dto/auth/auth.dto';
import { AuthApi } from '@infrastructure/api/auth.api';
import { AuthRepository } from '@application/ports/auth.repository';

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
