import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { User } from '@domain/entity/user';
import { RegisterRequest } from '@application/dto/auth/auth.dto';
import { AuthRepository, AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';

@Injectable({
  providedIn: 'root'
})
export class RegisterUseCase {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN) private authRepository: AuthRepository
  ) { }

  execute(payload: RegisterRequest): Observable<User> {
    return this.authRepository.register(payload);
  }
}
