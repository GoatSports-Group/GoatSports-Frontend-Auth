import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthRepository, AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class GetPublicKeyUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) { }

  execute(): Observable<string> {
    return this.authRepository.getPublicKey();
  }
}
