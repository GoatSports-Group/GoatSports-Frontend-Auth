import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@domain/entity/user';
import { AuthRepository, AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class LoginKeycloakUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) { }

  execute(payload: { code: string; redirectUri: string }): Observable<User> {
    return this.authRepository.loginWithKeycloak(payload);
  }
}
