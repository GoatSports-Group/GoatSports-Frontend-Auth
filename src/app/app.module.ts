import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientModule } from '@angular/common/http';
import { AppRoutingModule } from './app-routing.module';
import { RouterModule } from '@angular/router';
import { AppComponent } from './app.component';
import { IMAGE_CONFIG } from '@angular/common';

import { AUTH_REPOSITORY_TOKEN } from '@application/ports/auth.repository';
import { AuthRepositoryImpl } from '@infrastructure/repositories/auth.repository.impl';
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
    BrowserAnimationsModule
  ],
  providers: [
    { provide: AUTH_REPOSITORY_TOKEN, useClass: AuthRepositoryImpl },
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
