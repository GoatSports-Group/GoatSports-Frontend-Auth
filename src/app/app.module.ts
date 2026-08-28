import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { IMAGE_CONFIG } from '@angular/common';
import { NotifyComponent } from '@shared/components/notify/notify.component';

import { AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';
import { AuthRepositoryImpl } from '@infrastructure/repositories/auth.repository.impl';
import { VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN } from '@application/ports/venue-owner-registration.repository';
import { VenueOwnerRegistrationRepositoryImpl } from '@infrastructure/repositories/venue-owner-registration.repository.impl';
import {
  provideLucideIcons,
  LucideMail,
  LucideUser,
  LucideUserCheck,
  LucideLock
} from '@lucide/angular';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    RouterModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    NotifyComponent
  ],
  providers: [
    { provide: AUTH_REPOSITORY_TOKEN, useClass: AuthRepositoryImpl },
    {
      provide: VENUE_OWNER_REGISTRATION_REPOSITORY_TOKEN,
      useClass: VenueOwnerRegistrationRepositoryImpl
    },
    {
      provide: IMAGE_CONFIG,
      useValue: {
        disableImageSizeWarning: true,
        disableImageLazyLoadWarning: true
      }
    },
    provideLucideIcons(
      LucideMail,
      LucideUser,
      LucideUserCheck,
      LucideLock
    )
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
