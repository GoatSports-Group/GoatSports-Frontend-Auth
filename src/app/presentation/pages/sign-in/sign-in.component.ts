import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute, ParamMap } from '@angular/router';
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
import { resolvePostLoginDestination } from '@presentation/routing/post-login-destination';
import { AccountStatusError } from '@application/dto/auth/auth.dto';
import { AccountStatusDialogComponent } from './account-status-dialog.component';

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
    SubmitButtonComponent,
    AccountStatusDialogComponent
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
  /** Mật khẩu đúng nhưng tài khoản chưa kích hoạt / bị khóa: mở popup tương ứng. */
  accountStatus = signal<AccountStatusError | null>(null);

  ngOnInit() {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]]
    });

    // Tài khoản bị khóa đăng nhập bằng Google: auth-service chuyển về đây kèm mã khiếu nại. Mở popup rồi xóa
    // tham số khỏi thanh địa chỉ (mã dùng một lần, không để lại trong lịch sử).
    const blocked = blockedStatusFromQuery(this.route.snapshot.queryParamMap);
    if (blocked) {
      this.accountStatus.set(blocked);
      void this.router.navigate([], {
        relativeTo: this.route, replaceUrl: true,
        queryParams: { account: null, appealToken: null, email: null, fullName: null }, queryParamsHandling: 'merge'
      });
    }

    this.authService.sessionReady$.subscribe(ready => {
      if (ready && this.authService.isAuthenticated) {
        const user = this.authService.currentUser;
        window.location.href = this.resolvePostLoginDestination(user);
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
              window.location.href = this.resolvePostLoginDestination(user);
            }, 1000);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            const status = accountStatusFrom(err);
            if (status) {
              this.accountStatus.set(status);
              return;
            }
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

  /** Sang trang nhập OTP với email tài khoản; giữ ?redirect để đăng nhập xong quay về đúng nơi. */
  goToVerify(email: string) {
    this.accountStatus.set(null);
    this.router.navigate(['/verify'], { queryParams: { email }, queryParamsHandling: 'merge' });
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

  private resolvePostLoginDestination(user: { role?: { name?: string } } | null | undefined): string {
    return resolvePostLoginDestination(
      user?.role?.name,
      this.route.snapshot.queryParams['redirect'],
      {
        adminUrl: environment.adminApiUrl,
        clientUrl: environment.clientApiUrl
      }
    );
  }
}

/** 403 + error ACCOUNT_INACTIVE / ACCOUNT_BLOCKED từ auth-service (chỉ có khi mật khẩu đúng). */
export function accountStatusFrom(err: HttpErrorResponse): AccountStatusError | null {
  const code = err?.status === 403 ? err.error?.error : null;
  const data = err?.error?.data ?? {};
  if (code === 'ACCOUNT_INACTIVE' && data.email) {
    return { code, email: data.email, codeSent: data.codeSent !== false };
  }
  if (code === 'ACCOUNT_BLOCKED' && data.email && data.appealToken) {
    return { code, email: data.email, fullName: data.fullName, appealToken: data.appealToken,
      appealTtlMinutes: Number(data.appealTtlMinutes) || 30 };
  }
  return null;
}

/** /login?account=blocked&appealToken=…&email=…&fullName=… do auth-service gửi về sau khi Google xác thực. */
export function blockedStatusFromQuery(params: ParamMap): AccountStatusError | null {
  const appealToken = params.get('appealToken');
  const email = params.get('email');
  if (params.get('account') !== 'blocked' || !appealToken || !email) return null;
  return { code: 'ACCOUNT_BLOCKED', email, fullName: params.get('fullName') ?? undefined, appealToken, appealTtlMinutes: 30 };
}
