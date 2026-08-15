import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { environment } from "@environments/environment";
import { AuthCardComponent } from '@shared/components/auth-card/auth-card.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { SubmitButtonComponent } from '@shared/components/submit-button/submit-button.component';
import { PASSWORD_PATTERN } from '@shared/constants/auth.constants';

@Component({
  selector: 'app-sign-in',
  templateUrl: './sign-in.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AuthCardComponent,
    FormFieldComponent,
    PasswordInputComponent,
    SubmitButtonComponent
  ]
})
export class SignInComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private cryptoService = inject(CryptoService);

  loginForm!: FormGroup;
  loading = signal(false);

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
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

    this.loading.set(true);

    const username = this.loginForm.value.username.trim();
    const rawPassword = this.loginForm.value.password;

    this.cryptoService.getPublicKey().subscribe({
      next: (publicKey) => {
        const encryptedPassword = this.cryptoService.encrypt(rawPassword, publicKey);

        const payload = {
          username: username,
          password: encryptedPassword
        };

        this.authService.login(payload).subscribe({
          next: (user) => {
            this.loading.set(false);
            this.toastService.show(`Chào mừng ${user?.fullName || user?.username} đã quay trở lại!`, 'success');

            setTimeout(() => {
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
            }, 1000);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            const errorMsg = err.error?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại tài khoản!';
            this.toastService.show(errorMsg, 'error');
          }
        });
      },
      error: (err) => {
        this.loading.set(false);
        this.toastService.show('Không thể kết nối bảo mật để mã hóa mật khẩu!', 'error');
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