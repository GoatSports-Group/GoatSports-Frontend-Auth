import { InjectionToken } from '@angular/core';
import { Observable } from 'rxjs';
import {
  VenueOwnerAccountRegistrationRequest,
  VenueOwnerApplicationSubmissionRequest,
  VenueOwnerRegistrationSession
} from '@application/dto/venue-owner-registration/venue-owner-registration.dto';

export interface VenueOwnerRegistrationRepository {
  startAccount(request: VenueOwnerAccountRegistrationRequest): Observable<VenueOwnerRegistrationSession>;
  continueAfterEmailVerification(session: VenueOwnerRegistrationSession): Observable<VenueOwnerRegistrationSession>;
  submitApplication(
    session: VenueOwnerRegistrationSession,
    request: VenueOwnerApplicationSubmissionRequest
  ): Observable<void>;
}

export const VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN =
  new InjectionToken<VenueOwnerRegistrationRepository>('VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN');
