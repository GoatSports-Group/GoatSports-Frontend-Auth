import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthComponent } from './modules/auth/auth.component';
import { SignInComponent } from './modules/auth/pages/sign-in/sign-in.component';
import { SignUpComponent } from './modules/auth/pages/sign-up/sign-up.component';
import { VerifyComponent } from './modules/auth/pages/verify/verify.component';
import { ForgotPasswordComponent } from './modules/auth/pages/forgot-password/forgot-password.component';

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
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'enabled' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
