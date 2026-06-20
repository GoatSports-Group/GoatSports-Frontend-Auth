import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ForgotPasswordRequest } from '@application/dto/auth/auth.dto';
import { AuthRepository, AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class ForgotPasswordUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) { }

  execute(payload: ForgotPasswordRequest): Observable<any> {
    return this.authRepository.forgotPassword(payload);
  }
}
