import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  styleUrls: ['./sign-in.component.scss']
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

    const code = this.route.snapshot.queryParams['code'];
    if (code) {
      this.loginWithKeycloakCode(code);
      return;
    }

    this.authService.sessionReady$.subscribe(ready => {
      if (ready && this.authService.isAuthenticated) {
        const redirectUrl = this.route.snapshot.queryParams['redirect'];
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          const user = this.authService.currentUser;
          const roleName = (user?.role?.name || '').toUpperCase();
          const isAdmin = roleName === 'ADMIN';
          if (isAdmin) {
            window.location.href = `${import.meta.env.NG_APP_ADMIN_API_URL}/admin`;
          } else {
            window.location.href = import.meta.env.NG_APP_CLIENT_API_URL;
          }
        }
      }
    });
  }

  loginWithKeycloakCode(code: string) {
    this.loading = true;
    this.authService.loginWithKeycloak({ code, redirectUri: window.location.origin }).subscribe({
      next: (response) => {
        this.loading = false;
        const user = response?.data;

        this.snackBar.open(`Chào mừng ${user?.fullName || user?.username} đã quay trở lại!`, 'Đóng', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });

        // Clean up Keycloak URL query params
        this.router.navigate([], {
          queryParams: { code: null, session_state: null, iss: null },
          queryParamsHandling: 'merge'
        });

        const redirectUrl = this.route.snapshot.queryParams['redirect'];
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          const roleName = (user?.role?.name || '').toUpperCase();
          const isAdmin = roleName === 'ADMIN';
          if (isAdmin) {
            window.location.href = `${import.meta.env.NG_APP_ADMIN_API_URL}`;
          } else {
            window.location.href = import.meta.env.NG_APP_CLIENT_API_URL;
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        this.router.navigate([], {
          queryParams: { code: null, session_state: null, iss: null },
          queryParamsHandling: 'merge'
        });
        const errorMsg = err.error?.message || 'Đăng nhập bằng Keycloak thất bại!';
        this.snackBar.open(errorMsg, 'Đóng', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  redirectToKeycloak() {
    const keycloakUrl = import.meta.env.NG_APP_KEYCLOAK_URL;
    const realm = import.meta.env.NG_APP_KEYCLOAK_REALM;
    const clientId = import.meta.env.NG_APP_KEYCLOAK_CLIENT_ID;
    const redirectUri = window.location.origin;

    const authUrl = `${keycloakUrl}/realms/${realm}/protocol/openid-connect/auth`
      + `?client_id=${encodeURIComponent(clientId)}`
      + `&response_type=code`
      + `&redirect_uri=${encodeURIComponent(redirectUri)}`
      + `&scope=openid`;

    window.location.href = authUrl;
  }

  login() {
    if (this.loginForm.invalid) return;

    this.loading = true;

    const payload = {
      username: this.loginForm.value.username.trim(),
      password: this.loginForm.value.password
    };

    this.authService.login(payload).subscribe({
      next: (response) => {
        this.loading = false;
        const user = response?.data;

        this.snackBar.open(`Chào mừng ${user?.fullName || user?.username} đã quay trở lại!`, 'Đóng', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });

        const redirectUrl = this.route.snapshot.queryParams['redirect'];
        if (redirectUrl) {
          window.location.href = redirectUrl;
        } else {
          const roleName = (user?.role?.name || '').toUpperCase();
          const isAdmin = roleName === 'ADMIN' || roleName === 'STAFF' || roleName === 'NGƯỜI QUẢN TRỊ' || roleName === 'NHÂN VIÊN';
          if (isAdmin) {
            window.location.href = `${import.meta.env.NG_APP_ADMIN_API_URL}`;
          } else {
            window.location.href = import.meta.env.NG_APP_CLIENT_API_URL;
          }
        }
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
    window.location.href = import.meta.env.NG_APP_CLIENT_API_URL;
  }

  navigateToSignUp() {
    this.router.navigate(['/register'], { queryParamsHandling: 'preserve' });
  }

  navigateToForgotPassword() {
    this.router.navigate(['/forgot-password'], { queryParamsHandling: 'preserve' });
  }
}
