import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AUTH_REPOSITORY_TOKEN } from '../../domain/repositories/tokens';

@Injectable({
  providedIn: 'root'
})
export class ResendVerificationUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) {}

  execute(email: string): Observable<any> {
    return this.authRepository.resendVerificationCode(email);
  }
}
