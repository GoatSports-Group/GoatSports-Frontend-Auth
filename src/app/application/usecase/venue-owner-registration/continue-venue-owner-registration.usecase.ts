import { Inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { VenueOwnerRegistrationSession } from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
import {
  VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN,
  VenueOwnerRegistrationRepository
} from '@application/ports/venue-owner-registration.repository';

@Injectable({ providedIn: 'root' })
export class ContinueVenueOwnerRegistrationUseCase {
  constructor(
    @Inject(VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN)
    private readonly repository: VenueOwnerRegistrationRepository
  ) { }

  execute(session: VenueOwnerRegistrationSession): Observable<VenueOwnerRegistrationSession> {
    return this.repository.continueAfterEmailVerification(session);
  }
}
