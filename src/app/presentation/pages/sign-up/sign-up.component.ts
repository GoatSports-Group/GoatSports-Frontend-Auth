import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, ElementRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpErrorResponse } from '@angular/common/http';
import { AbstractControl, FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { finalize, map, switchMap, take, timer } from 'rxjs';
import { RegisterRequest, RegistrationAccountType } from '@application/dto/auth/auth.dto';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { ToastService } from '@shared/services/toast.service';
import { AuthCardComponent } from '@shared/components/auth-card/auth-card.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { PasswordStrengthComponent } from '@shared/components/password-strength/password-strength.component';
import { ScreenLoaderComponent } from '@shared/components/screen-loader/screen-loader.component';
import { SubmitButtonComponent } from '@shared/components/submit-button/submit-button.component';
import { LucideIconComponent } from '@shared/components/ui/lucide-icon.component';
import { registrationForm, RegistrationFormValue } from './sign-up.form';

type RegistrationControlName = keyof RegistrationFormValue;

@Component({
  selector: 'app-sign-up',
  standalone: true,
  templateUrl: './sign-up.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AuthCardComponent,
    FormFieldComponent,
    PasswordInputComponent,
    PasswordStrengthComponent,
    LucideIconComponent,
    SubmitButtonComponent,
    ScreenLoaderComponent
  ]
})
export class SignUpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toast = inject(ToastService);
  private readonly crypto = inject(CryptoService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly accountType = signal<RegistrationAccountType>(this.readInitialAccountType());
  readonly loading = signal(false);
  readonly registrationSucceeded = signal(false);
  readonly successMessage = signal('');
  readonly apiError = signal<string | null>(null);
  private readonly submitted = signal(false);
  private readonly duplicateUsername = signal(false);
  private readonly duplicateEmail = signal(false);
  private readonly validationVersion = signal(0);

  readonly signUpForm = registrationForm(this.fb, {
    duplicateUsername: () => this.duplicateUsername(),
    duplicateEmail: () => this.duplicateEmail()
  });

  readonly loadingTitle = computed(() => this.accountType() === 'VENUE_OWNER'
    ? 'Đang tạo tài khoản chủ sân'
    : 'Đang tạo tài khoản người chơi');
  readonly loadingMessage = computed(() =>
    'Hệ thống đang tạo tài khoản và gửi mã OTP tới email của bạn. Vui lòng không đóng hoặc tải lại trang.');

  readonly usernameError = computed(() => this.getControlError('username', {
    required: 'Bắt buộc',
    trimmedMinLength: 'Cần ít nhất 3 ký tự',
    trimmedMaxLength: 'Tối đa 50 ký tự',
    pattern: 'Không được chứa khoảng trắng',
    duplicate: 'Đã được sử dụng'
  }));
  readonly fullNameError = computed(() => this.getControlError('fullName', {
    required: 'Bắt buộc',
    trimmedMinLength: 'Cần ít nhất 2 ký tự',
    trimmedMaxLength: 'Tối đa 100 ký tự'
  }));
  readonly emailError = computed(() => this.getControlError('email', {
    required: 'Bắt buộc',
    trimmedMaxLength: 'Tối đa 254 ký tự',
    email: 'Không đúng định dạng',
    duplicate: 'Đã được sử dụng'
  }));
  readonly passwordError = computed(() => this.getControlError('password', {
    required: 'Bắt buộc',
    pattern: 'Ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt'
  }));
  readonly confirmPasswordError = computed(() => this.getControlError('confirmPassword', {
    required: 'Bắt buộc',
    passwordMismatch: 'Không khớp'
  }));
  readonly passwordValidationErrors = computed(() => [
    this.passwordError(),
    this.confirmPasswordError()
  ].filter(message => !!message));

  constructor() {
    this.signUpForm.events
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.validationVersion.update(value => value + 1));
    this.clearDuplicateOnChange('username');
    this.clearDuplicateOnChange('email');
  }

  setAccountType(type: RegistrationAccountType): void {
    if (this.loading() || this.registrationSucceeded() || type === this.accountType()) return;
    this.accountType.set(type);
    this.apiError.set(null);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { accountType: type },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  register(): void {
    if (this.loading() || this.registrationSucceeded()) return;
    this.submitted.set(true);
    this.signUpForm.markAllAsTouched();
    this.validationVersion.update(value => value + 1);
    if (this.signUpForm.invalid) {
      this.focusFirstInvalidControl();
      return;
    }

    this.loading.set(true);
    this.apiError.set(null);
    this.signUpForm.disable({ emitEvent: false });
    const formValue = this.signUpForm.getRawValue();
    const accountType = this.accountType();

    this.crypto.getPublicKey().pipe(
      take(1),
      map(publicKey => this.createRegisterPayload(formValue, publicKey)),
      switchMap(payload => this.authService.register(payload)),
      finalize(() => this.loading.set(false)),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.handleSuccess(accountType, formValue.email.trim()),
      error: error => this.handleError(error)
    });
  }

  private createRegisterPayload(value: RegistrationFormValue, publicKey: string): RegisterRequest {
    const password = this.crypto.encrypt(value.password, publicKey);
    const confirmPassword = this.crypto.encrypt(value.confirmPassword, publicKey);
    if (!password || !confirmPassword || password === value.password || confirmPassword === value.confirmPassword) {
      throw new Error('REGISTRATION_ENCRYPTION_FAILED');
    }
    return {
      accountType: this.accountType(),
      username: value.username.trim(),
      fullName: value.fullName.trim(),
      email: value.email.trim(),
      password,
      confirmPassword
    };
  }

  private handleSuccess(type: RegistrationAccountType, email: string): void {
    const label = type === 'VENUE_OWNER' ? 'đối tác chủ sân' : 'người chơi';
    const message = `Tài khoản ${label} đã được tạo. Vui lòng xác thực email để tiếp tục.`;
    this.registrationSucceeded.set(true);
    this.successMessage.set(message);
    this.toast.show(message, 'success');
    timer(700).pipe(take(1), takeUntilDestroyed(this.destroyRef)).subscribe(() => {
      void this.router.navigate(['/verify'], {
        queryParams: { email }
      });
    });
  }

  private handleError(error: unknown): void {
    this.signUpForm.enable({ emitEvent: false });
    let message = this.extractApiMessage(error);
    const normalized = message.toLocaleLowerCase('vi');
    if (this.isDuplicate(normalized)) {
      if (normalized.includes('email')) this.addDuplicateError('email');
      else if (normalized.includes('username') || normalized.includes('tên đăng nhập')) this.addDuplicateError('username');
      else {
        this.addDuplicateError('username');
        this.addDuplicateError('email');
      }
      message = 'Tên đăng nhập hoặc email đã được sử dụng. Vui lòng kiểm tra lại.';
    }
    this.apiError.set(message);
    this.toast.show(message, 'error');
    this.focusFirstInvalidControl();
  }

  private getControlError(name: RegistrationControlName, messages: Record<string, string>): string {
    this.validationVersion();
    const control = this.signUpForm.controls[name];
    if ((!control.touched && !this.submitted()) || !control.errors) return '';
    if (name === 'confirmPassword' && this.signUpForm.hasError('passwordMismatch')) {
      return messages['passwordMismatch'] ?? '';
    }
    const key = Object.keys(control.errors)[0];
    return messages[key] ?? 'Thông tin chưa hợp lệ';
  }

  private clearDuplicateOnChange(name: 'username' | 'email'): void {
    this.signUpForm.controls[name].valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        name === 'username' ? this.duplicateUsername.set(false) : this.duplicateEmail.set(false);
        this.signUpForm.controls[name].updateValueAndValidity({ emitEvent: false });
      });
  }

  private addDuplicateError(name: 'username' | 'email'): void {
    name === 'username' ? this.duplicateUsername.set(true) : this.duplicateEmail.set(true);
    const control = this.signUpForm.controls[name];
    control.setErrors({ ...control.errors, duplicate: true });
    control.markAsTouched();
  }

  private focusFirstInvalidControl(): void {
    queueMicrotask(() => this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
  }

  private extractApiMessage(error: unknown): string {
    if (error instanceof Error && error.message === 'REGISTRATION_ENCRYPTION_FAILED') {
      return 'Không thể mã hóa mật khẩu an toàn. Vui lòng tải lại trang và thử lại.';
    }
    if (error instanceof HttpErrorResponse) {
      const body = error.error as { message?: unknown; error?: unknown } | string | null;
      if (typeof body === 'string' && body.trim()) return body;
      if (body && typeof body === 'object') {
        if (typeof body.message === 'string' && body.message.trim()) return body.message;
        if (typeof body.error === 'string' && body.error.trim()) return body.error;
      }
    }
    return 'Không thể đăng ký lúc này. Vui lòng thử lại.';
  }

  private isDuplicate(message: string): boolean {
    return ['đã tồn tại', 'đã được sử dụng', 'already exists', 'duplicate'].some(value => message.includes(value));
  }

  private readInitialAccountType(): RegistrationAccountType {
    return this.route.snapshot.queryParamMap.get('accountType')?.toUpperCase() === 'VENUE_OWNER'
      ? 'VENUE_OWNER'
      : 'PLAYER';
  }
}
