import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VerificationRequest } from '@application/dto/auth/auth.dto';
import { AuthRepository, AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class VerifyUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) { }

  execute(payload: VerificationRequest): Observable<void> {
    return this.authRepository.verify(payload);
  }
}
