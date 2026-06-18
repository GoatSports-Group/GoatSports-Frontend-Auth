import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseResponse } from '../../domain/entities/base';
import { User } from '../../domain/entities/user';
import { AuthRepository } from '../../domain/repositories/auth.repository';
import { AUTH_REPOSITORY_TOKEN } from '../../domain/repositories/tokens';

@Injectable({
  providedIn: 'root'
})
export class LoginKeycloakUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) {}

  execute(payload: { code: string; redirectUri: string }): Observable<BaseResponse<User>> {
    return this.authRepository.loginWithKeycloak(payload);
  }
}
