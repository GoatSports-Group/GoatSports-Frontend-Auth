import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { AuthCardComponent } from '@shared/components/auth-card/auth-card.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { PasswordStrengthComponent } from '@shared/components/password-strength/password-strength.component';
import { SubmitButtonComponent } from '@shared/components/submit-button/submit-button.component';
import { PASSWORD_PATTERN } from '@shared/constants/auth.constants';
import { passwordMatchValidator } from '@shared/validators/password.validators';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AuthCardComponent,
    FormFieldComponent,
    PasswordInputComponent,
    PasswordStrengthComponent,
    SubmitButtonComponent
  ]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private cryptoService = inject(CryptoService);

  forgotForm: FormGroup;
  loading = signal(false);
  private submitted = signal(false);

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: passwordMatchValidator
    });
  }

  onSubmitStep1() {
    this.submitted.set(true);
    this.forgotForm.markAllAsTouched();
    if (this.forgotForm.invalid) return;

    this.loading.set(true);

    const email = this.forgotForm.value.email.trim();
    const rawPassword = this.forgotForm.value.password;
    const rawConfirmPassword = this.forgotForm.value.confirmPassword;

    this.cryptoService.getPublicKey().subscribe({
      next: (publicKey) => {
        const encryptedPassword = this.cryptoService.encrypt(rawPassword, publicKey);
        const encryptedConfirmPassword = this.cryptoService.encrypt(rawConfirmPassword, publicKey);

        const payload = {
          email: email,
          password: encryptedPassword,
          confirmPassword: encryptedConfirmPassword
        };

        this.authService.forgotPassword(payload).subscribe({
          next: () => {
            this.loading.set(false);
            this.toastService.show('Mã xác thực 6 chữ số đã được gửi tới Email của bạn!', 'success');

            setTimeout(() => {
              this.router.navigate(['/verify'], { queryParams: { email: email }, queryParamsHandling: 'merge' });
            }, 1500);
          },
          error: (err: HttpErrorResponse) => {
            this.loading.set(false);
            const errorMsg = err.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
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

  navigateToSignIn() {
    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }

  passwordHasError(): boolean {
    const control = this.forgotForm.get('password');
    return !!(control?.invalid && (control.touched || this.submitted()));
  }

  confirmPasswordHasError(): boolean {
    const control = this.forgotForm.get('confirmPassword');
    return !!(control?.invalid && (control.touched || this.submitted()));
  }

  passwordValidationErrors(): string[] {
    const errors: string[] = [];
    const password = this.forgotForm.get('password');
    const confirmPassword = this.forgotForm.get('confirmPassword');

    if (this.passwordHasError()) {
      errors.push(password?.hasError('required')
        ? 'Vui lòng nhập mật khẩu mới.'
        : 'Mật khẩu cần ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt.');
    }

    if (this.confirmPasswordHasError()) {
      errors.push(confirmPassword?.hasError('required')
        ? 'Vui lòng xác nhận mật khẩu mới.'
        : 'Mật khẩu xác nhận không khớp.');
    }

    return errors;
  }
}
