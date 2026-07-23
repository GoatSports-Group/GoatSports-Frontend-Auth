import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '@presentation/services/auth.service';
import { environment } from "@environments/environment";

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss'],
  standalone: false
})
export class SignInComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  loginForm!: FormGroup;
  loading = false;
  hidePassword = true;

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)]]
    });

    this.authService.sessionReady$.subscribe(ready => {
      if (ready && this.authService.isAuthenticated) {
        const user = this.authService.currentUser;
        const roleName = (user?.role?.name || '').toUpperCase();
        const isAdmin = roleName === 'ADMIN';

        if (isAdmin) {
          window.location.href = environment.adminApiUrl;
        } else {
          const redirectUrl = this.route.snapshot.queryParams['redirect'];
          if (redirectUrl) {
            window.location.href = redirectUrl;
          } else {
            window.location.href = environment.clientApiUrl;
          }
        }
      }
    });
  }

  login() {
    if (this.loginForm.invalid) return;

    this.loading = true;

    const payload = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password
    };

    this.authService.login(payload).subscribe({
      next: (user) => {
        this.loading = false;

        const snackBarRef = this.snackBar.open(`Chào mừng ${user?.fullName || user?.username} đã quay trở lại!`, 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });

        snackBarRef.afterDismissed().subscribe(() => {
          const roleName = (user?.role?.name || '').toUpperCase();
          const isAdmin = roleName === 'ADMIN';

          if (isAdmin) {
            const redirectUrl = this.route.snapshot.queryParams['redirect'];
            if (redirectUrl && redirectUrl.includes('localhost:4300')) {
              window.location.href = redirectUrl;
            } else {
              window.location.href = `${environment.adminApiUrl}/admin`;
            }
          } else {
            const redirectUrl = this.route.snapshot.queryParams['redirect'];
            if (redirectUrl) {
              window.location.href = redirectUrl;
            } else {
              window.location.href = environment.clientApiUrl;
            }
          }
        });
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const errorMsg = err.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản!';
        this.snackBar.open(errorMsg, 'Đóng', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  navigateToHome() {
    window.location.href = environment.clientApiUrl;
  }

  navigateToSignUp() {
    this.router.navigate(['/register'], { queryParamsHandling: 'preserve' });
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password'], { queryParamsHandling: 'preserve' });
  }

  loginWithGoogle() {
    const keycloakUrl = environment.keycloak.url;
    const realm = environment.keycloak.realm;
    const clientId = environment.keycloak.clientId;
    const callbackUrl = environment.backendCallbackUrl;

    const redirectUrlParam = this.route.snapshot.queryParams['redirect'];
    const frontendRedirectTarget = redirectUrlParam || environment.clientApiUrl;

    const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`
      + `?client_id=${encodeURIComponent(clientId)}`
      + `&response_type=code`
      + `&redirect_uri=${encodeURIComponent(callbackUrl)}`
      + `&state=${encodeURIComponent(frontendRedirectTarget)}`
      + `&scope=openid`
      + `&kc_idp_hint=google`;

    window.location.href = authUrl;
  }
}