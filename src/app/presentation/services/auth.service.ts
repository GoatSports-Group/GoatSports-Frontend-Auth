import { Injectable, inject } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { SessionStateService } from '@presentation/services/session-state.service';
import { User } from '@application/dto/user/user.dto';
import { LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '@application/dto/auth/auth.dto';
import { LoginUseCase } from '@application/usecase/auth/login.usecase';
import { RegisterUseCase } from '@application/usecase/auth/register.usecase';
import { VerifyUseCase } from '@application/usecase/auth/verify.usecase';
import { ForgotPasswordUseCase } from '@application/usecase/auth/forgot-password.usecase';
import { ResendVerificationUseCase } from '@application/usecase/auth/resend-verification.usecase';
import { RefreshTokenUseCase } from '@application/usecase/auth/refresh-token.usecase';
import { GetCurrentUserUseCase } from '@application/usecase/auth/get-current-user.usecase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private sessionStateService = inject(SessionStateService);
  private router = inject(Router);

  private loginUseCase = inject(LoginUseCase);
  private registerUseCase = inject(RegisterUseCase);
  private verifyUseCase = inject(VerifyUseCase);
  private forgotPasswordUseCase = inject(ForgotPasswordUseCase);
  private resendVerificationUseCase = inject(ResendVerificationUseCase);
  private refreshTokenUseCase = inject(RefreshTokenUseCase);
  private getCurrentUserUseCase = inject(GetCurrentUserUseCase);

  private isLoggingOut = false;

  public currentUser$ = this.sessionStateService.currentUser$;
  public isAuthenticated$ = this.sessionStateService.isAuthenticated$;
  public sessionReady$ = this.sessionStateService.sessionReady$;

  constructor() {
    this.loadSession();
  }

  login(payload: LoginRequest): Observable<User> {
    return this.loginUseCase.execute(payload).pipe(
      tap(userProfile => {
        this.sessionStateService.setCurrentUser(userProfile || null);
      })
    );
  }

  register(payload: RegisterRequest): Observable<User> {
    return this.registerUseCase.execute(payload);
  }

  verify(payload: VerificationRequest): Observable<void> {
    return this.verifyUseCase.execute(payload);
  }

  forgotPassword(payload: ForgotPasswordRequest): Observable<void> {
    return this.forgotPasswordUseCase.execute(payload);
  }

  resendVerificationCode(email: string): Observable<void> {
    return this.resendVerificationUseCase.execute(email);
  }

  refresh(): Observable<User> {
    return this.refreshTokenUseCase.execute().pipe(
      tap({
        next: userProfile => {
          this.sessionStateService.setCurrentUser(userProfile || null);
        },
        error: () => { }
      })
    );
  }

  getCurrentUser(): Observable<User> {
    return this.getCurrentUserUseCase.execute().pipe(
      tap({
        next: userProfile => {
          this.sessionStateService.setCurrentUser(userProfile || null);
        },
        error: () => {
          this.clearSession();
        }
      })
    );
  }

  public get currentUser(): User | null {
    return this.sessionStateService.getCurrentUser();
  }

  public get isAuthenticated(): boolean {
    return this.sessionStateService.getIsAuthenticated();
  }

  public performLogout() {
    if (this.isLoggingOut) {
      console.log('Already logging out...');
      return;
    }

    this.isLoggingOut = true;
    console.log('Performing logout...');
    this.clearSession();

    this.router.navigate(['/']).then(() => {
      setTimeout(() => {
        this.isLoggingOut = false;
      }, 1000);
    });
  }

  private loadSession() {
    this.getCurrentUser().subscribe({
      next: () => {
        this.sessionStateService.setSessionReady(true);
      },
      error: () => {
        this.refresh().subscribe({
          next: () => {
            this.sessionStateService.setSessionReady(true);
          },
          error: () => {
            this.clearSession();
            this.sessionStateService.setSessionReady(true);
          }
        });
      }
    });
  }

  private clearSession() {
    this.sessionStateService.clearSession();
  }
}
