import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import { VenueOwnerRegistrationRequest } from '@application/dto/venue-owner-registration/venue-owner-registration.dto';

export interface VenueOwnerRegistrationRepository {
  register(request: VenueOwnerRegistrationRequest): Observable<void>;
}

export const VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN =
  new InjectionToken<VenueOwnerRegistrationRepository>('VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN');
