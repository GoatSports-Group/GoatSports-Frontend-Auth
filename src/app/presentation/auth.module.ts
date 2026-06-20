import { NgModule } from '@angular/core';
import { AuthComponent } from '@presentation/layout/auth.component';
import { SignInComponent } from '@presentation/pages/sign-in/sign-in.component';
import { SignUpComponent } from '@presentation/pages/sign-up/sign-up.component';
import { VerifyComponent } from '@presentation/pages/verify/verify.component';
import { ForgotPasswordComponent } from '@presentation/pages/forgot-password/forgot-password.component';
import { AuthRoutingModule } from '@presentation/routes/auth-routing.module';
import { SharedModule } from '@shared/shared.module';

@NgModule({
  declarations: [
    AuthComponent,
    SignInComponent,
    SignUpComponent,
    VerifyComponent,
    ForgotPasswordComponent
  ],
  imports: [
    SharedModule,
    AuthRoutingModule
  ]
})
export class AuthModule { }
