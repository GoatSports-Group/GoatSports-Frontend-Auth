import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AccountAppealRequest } from '@application/dto/auth/auth.dto';
import { AuthRepository, AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class SubmitAccountAppealUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) { }

  execute(payload: AccountAppealRequest): Observable<void> {
    return this.authRepository.submitAccountAppeal(payload);
  }
}
