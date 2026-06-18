import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from '../layout/auth.component';
import { SignInComponent } from '../pages/sign-in/sign-in.component';
import { SignUpComponent } from '../pages/sign-up/sign-up.component';
import { VerifyComponent } from '../pages/verify/verify.component';
import { ForgotPasswordComponent } from '../pages/forgot-password/forgot-password.component';

const routes: Routes = [
  {
    path: '',
    component: AuthComponent,
    children: [
      { path: 'login', component: SignInComponent },
      { path: 'auth/sign-in', component: SignInComponent },
      { path: 'register', component: SignUpComponent },
      { path: 'auth/sign-up', component: SignUpComponent },
      { path: 'verify', component: VerifyComponent },
      { path: 'auth/verify', component: VerifyComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'auth/forgot-password', component: ForgotPasswordComponent },
      { path: '', redirectTo: 'login', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class AuthRoutingModule { }
