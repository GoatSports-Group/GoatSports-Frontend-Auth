import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ForgotPasswordRequest } from '../../domain/entities/user';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AUTH_REPOSITORY_TOKEN } from '../../domain/repositories/tokens';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) {}

  execute(payload: ForgotPasswordRequest): Observable<any> {
    return this.authRepository.forgotPassword(payload);
  }
}
