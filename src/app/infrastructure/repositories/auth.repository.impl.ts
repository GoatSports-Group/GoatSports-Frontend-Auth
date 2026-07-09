import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { User } from '@domain/entity/user';
import { LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '@application/dto/auth/auth.dto';
import { AuthApi } from '@infrastructure/api/auth.api';
import { AuthRepository } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class AuthRepositoryImpl implements AuthRepository {
  private authApi = inject(AuthApi);

  login(payload: LoginRequest): Observable<User> {
    return this.authApi.login(payload).pipe(
      map(response => response.data)
    );
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.authApi.register(payload).pipe(
      map(response => response.data)
    );
  }

  verify(payload: VerificationRequest): Observable<void> {
    return this.authApi.verify(payload).pipe(
      map(response => response.data)
    );
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.authApi.forgotPassword(payload).pipe(
      map(response => response.data)
    );
  }

  resendVerificationCode(email: string): Observable<void> {
    return this.authApi.resendVerificationCode(email).pipe(
      map(response => response.data)
    );
  }

  refresh(): Observable<User> {
    return this.authApi.refresh().pipe(
      map(response => response.data)
    );
  }

  getCurrentUser(): Observable<User> {
    return this.authApi.getCurrentUser().pipe(
      map(response => response.data)
    );
  }
}
