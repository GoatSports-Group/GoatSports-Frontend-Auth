import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, map, switchMap, take, timer } from 'rxjs';
import { RegisterRequest } from '@application/dto/auth/auth.dto';
import {
  VenueOwnerDocumentKey,
  VenueOwnerRegistrationFiles,
  VenueOwnerRegistrationRequest
} from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
import { RegisterVenueOwnerUseCase } from '@application/usecase/venue-owner-registration/register-venue-owner.usecase';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { ToastService } from '@shared/services/toast.service';
import { AuthCardComponent } from '@shared/components/auth-card/auth-card.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
import { SubmitButtonComponent } from '@shared/components/submit-button/submit-button.component';
import { RegistrationJourneyStepperComponent } from '@shared/components/registration-journey-stepper/registration-journey-stepper.component';
import { ScreenLoaderComponent } from '@shared/components/screen-loader/screen-loader.component';
import { PASSWORD_PATTERN } from '@shared/constants/auth.constants';
import { trimmedLengthValidator } from '@shared/validators/registration.validators';
import { passwordMatchValidator } from '@shared/validators/password.validators';

export type RegistrationAccountType = 'PLAYER' | 'VENUE_OWNER';
type OwnerRegistrationStep = 1 | 2 | 3 | 4 | 5;

type RegistrationControlName = 'username' | 'fullName' | 'email' | 'password' | 'confirmPassword';
type RegistrationFormValue = {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
};

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
    SubmitButtonComponent,
    RegistrationJourneyStepperComponent,
    ScreenLoaderComponent
  ]
})
export class SignUpComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly toastService = inject(ToastService);
  private readonly cryptoService = inject(CryptoService);
  private readonly registerVenueOwnerUseCase = inject(RegisterVenueOwnerUseCase);
  private readonly destroyRef = inject(DestroyRef);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly accountType = signal<RegistrationAccountType>('PLAYER');
  readonly ownerStep = signal<OwnerRegistrationStep>(1);
  readonly loading = signal(false);
  readonly loadingTitle = computed(() => this.accountType() === 'VENUE_OWNER'
    ? 'Đang tạo hồ sơ chủ sân'
    : 'Đang tạo tài khoản người chơi');
  readonly loadingMessage = computed(() => this.accountType() === 'VENUE_OWNER'
    ? 'Hệ thống đang tạo tài khoản, hồ sơ và tải tài liệu. Vui lòng không đóng hoặc tải lại trang.'
    : 'Hệ thống đang tạo tài khoản của bạn. Vui lòng không đóng hoặc tải lại trang.');
  readonly registrationSucceeded = signal(false);
  readonly successMessage = signal('');
  readonly apiError = signal<string | null>(null);
  readonly passwordStrength = signal(0);
  readonly ownerFiles = signal<Record<VenueOwnerDocumentKey, File | null>>({
    idCardFront: null,
    idCardBack: null,
    businessLicense: null,
    venueImage: null
  });
  readonly fileError = signal<string | null>(null);

  private readonly submitted = signal(false);
  private readonly validationVersion = signal(0);
  private readonly duplicateUsername = signal(false);
  private readonly duplicateEmail = signal(false);

  readonly signUpForm = this.fb.nonNullable.group({
    username: ['', [
      Validators.required,
      trimmedLengthValidator(3, 50),
      Validators.pattern(/^\S+$/),
      () => this.duplicateUsername() ? { duplicate: true } : null
    ]],
    fullName: ['', [Validators.required, trimmedLengthValidator(2, 100)]],
    email: ['', [
      Validators.required,
      trimmedLengthValidator(1, 254),
      Validators.email,
      () => this.duplicateEmail() ? { duplicate: true } : null
    ]],
    password: ['', [Validators.required, Validators.pattern(PASSWORD_PATTERN)]],
    confirmPassword: ['', [Validators.required]]
  }, { validators: passwordMatchValidator });

  readonly ownerForm = this.fb.nonNullable.group({
    phone: ['', [Validators.required, Validators.pattern(/^(0\d{9}|\+84\d{9})$/)]],
    identityNumber: ['', [Validators.required, Validators.pattern(/^[A-Za-z0-9]{6,12}$/)]],
    businessName: ['', [Validators.required, trimmedLengthValidator(2, 150)]],
    businessType: ['INDIVIDUAL', [Validators.required]],
    taxCode: ['', [Validators.required, Validators.pattern(/^(\d{10}|\d{13})$/)]],
    address: ['', [Validators.required, trimmedLengthValidator(3, 255)]],
    province: ['', [Validators.required]],
    district: ['', [Validators.required]],
    ward: ['', [Validators.required]],
    city: ['', [Validators.required]]
  });

  readonly usernameError = computed(() => this.getControlError('username', {
    required: 'Vui lòng nhập tên đăng nhập',
    trimmedMinLength: 'Tên đăng nhập cần ít nhất 3 ký tự',
    trimmedMaxLength: 'Tên đăng nhập tối đa 50 ký tự',
    pattern: 'Tên đăng nhập không được chứa khoảng trắng',
    duplicate: 'Tên đăng nhập này đã được sử dụng'
  }));

  readonly fullNameError = computed(() => this.getControlError('fullName', {
    required: 'Vui lòng nhập họ và tên',
    trimmedMinLength: 'Họ và tên cần ít nhất 2 ký tự',
    trimmedMaxLength: 'Họ và tên tối đa 100 ký tự'
  }));

  readonly emailError = computed(() => this.getControlError('email', {
    required: 'Vui lòng nhập email',
    trimmedMinLength: 'Vui lòng nhập email',
    trimmedMaxLength: 'Email tối đa 254 ký tự',
    email: 'Email chưa đúng định dạng',
    duplicate: 'Email này đã được sử dụng'
  }));

  readonly passwordError = computed(() => this.getControlError('password', {
    required: 'Vui lòng nhập mật khẩu',
    pattern: 'Cần 8 ký tự, chữ hoa, chữ thường, số và ký tự đặc biệt'
  }));

  readonly confirmPasswordError = computed(() => this.getControlError('confirmPassword', {
    required: 'Vui lòng xác nhận mật khẩu',
    passwordMismatch: 'Mật khẩu xác nhận không khớp'
  }));

  readonly ownerFieldError = (controlName: keyof typeof this.ownerForm.controls): string => {
    this.validationVersion();
    const control = this.ownerForm.controls[controlName];
    if (!control.touched || !control.errors) {
      return '';
    }
    if (control.hasError('required')) return 'Vui lòng nhập thông tin này';
    if (controlName === 'phone') return 'Số điện thoại không đúng định dạng';
    if (controlName === 'identityNumber') return 'CCCD / Hộ chiếu gồm 6–12 ký tự';
    if (controlName === 'taxCode') return 'Mã số thuế phải gồm 10 hoặc 13 chữ số';
    return 'Thông tin chưa hợp lệ';
  };

  constructor() {
    this.accountType.set(this.readInitialAccountType());

    this.signUpForm.controls.password.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(password => {
        this.passwordStrength.set(this.checkPasswordStrength(password));
        this.validationVersion.update(version => version + 1);
      });

    this.signUpForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.validationVersion.update(version => version + 1));

    this.ownerForm.statusChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.validationVersion.update(version => version + 1));

    this.clearDuplicateErrorOnChange('username');
    this.clearDuplicateErrorOnChange('email');
  }

  setAccountType(type: RegistrationAccountType): void {
    if (this.loading() || this.registrationSucceeded() || type === this.accountType()) {
      return;
    }

    this.accountType.set(type);
    this.ownerStep.set(1);
    this.submitted.set(false);
    this.signUpForm.markAsUntouched();
    this.apiError.set(null);
    this.validationVersion.update(version => version + 1);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { accountType: type },
      queryParamsHandling: 'merge',
      replaceUrl: true
    });
  }

  register(): void {
    if (this.loading() || this.registrationSucceeded()) {
      return;
    }

    if (this.accountType() === 'VENUE_OWNER' && this.ownerStep() < 5) {
      this.nextOwnerStep();
      return;
    }

    this.submitted.set(true);
    this.signUpForm.markAllAsTouched();
    if (this.accountType() === 'VENUE_OWNER') {
      this.ownerForm.markAllAsTouched();
    }
    this.validationVersion.update(version => version + 1);

    if (this.signUpForm.invalid || (this.accountType() === 'VENUE_OWNER' && !this.isOwnerSubmissionValid())) {
      this.focusFirstInvalidControl();
      return;
    }

    this.apiError.set(null);
    this.loading.set(true);
    this.signUpForm.disable({ emitEvent: false });
    this.ownerForm.disable({ emitEvent: false });

    const formValue = this.signUpForm.getRawValue();
    const accountType = this.accountType();
    const email = formValue.email.trim();

    this.cryptoService.getPublicKey().pipe(
      take(1),
      map(publicKey => this.createRegisterPayload(formValue, publicKey)),
      switchMap(payload => accountType === 'VENUE_OWNER'
        ? this.registerVenueOwnerUseCase.execute(this.createVenueOwnerRequest(payload))
        : this.authService.register(payload)),
      finalize(() => {
        this.loading.set(false);
        this.validationVersion.update(version => version + 1);
      }),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.handleRegistrationSuccess(accountType, email),
      error: error => this.handleRegistrationError(error)
    });
  }

  navigateToSignIn(): void {
    void this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }

  ownerStepTitle(): string {
    return ['Thông tin tài khoản', 'Bảo mật tài khoản', 'Xác thực kinh doanh', 'Địa chỉ sân', 'Hồ sơ chủ sân'][this.ownerStep() - 1];
  }

  ownerStepDescription(): string {
    return [
      'Thông tin người đại diện và tài khoản',
      'Tạo mật khẩu bảo vệ tài khoản',
      'Thông tin pháp lý của cơ sở kinh doanh',
      'Địa chỉ cơ sở hoặc sân dự kiến vận hành',
      'Tải tài liệu giống quy trình Owner Application'
    ][this.ownerStep() - 1];
  }

  nextOwnerStep(): void {
    if (this.accountType() !== 'VENUE_OWNER' || this.loading() || this.registrationSucceeded()) {
      return;
    }

    const controls = this.getOwnerStepControls(this.ownerStep());
    controls.forEach(control => control.markAsTouched());
    this.validationVersion.update(version => version + 1);

    if (controls.some(control => control.invalid) || (this.ownerStep() === 2 && this.signUpForm.invalid)) {
      this.focusFirstInvalidControl();
      return;
    }

    this.apiError.set(null);
    this.ownerStep.update(step => Math.min(5, step + 1) as OwnerRegistrationStep);
    this.focusOwnerStepHeading();
  }

  previousOwnerStep(): void {
    if (this.accountType() !== 'VENUE_OWNER' || this.loading() || this.registrationSucceeded()) {
      return;
    }

    this.ownerStep.update(step => Math.max(1, step - 1) as OwnerRegistrationStep);
    this.focusOwnerStepHeading();
  }

  goToOwnerStep(step: number): void {
    if (
      this.accountType() !== 'VENUE_OWNER' ||
      this.loading() ||
      this.registrationSucceeded() ||
      step < 1 ||
      step > 5 ||
      step > this.ownerStep()
    ) {
      return;
    }

    this.ownerStep.set(step as OwnerRegistrationStep);
    this.apiError.set(null);
    this.focusOwnerStepHeading();
  }

  private createRegisterPayload(
    formValue: RegistrationFormValue,
    publicKey: string
  ): RegisterRequest {
    const encryptedPassword = this.cryptoService.encrypt(formValue.password, publicKey);
    const encryptedConfirmPassword = this.cryptoService.encrypt(formValue.confirmPassword, publicKey);

    if (
      !encryptedPassword ||
      !encryptedConfirmPassword ||
      encryptedPassword === formValue.password ||
      encryptedConfirmPassword === formValue.confirmPassword
    ) {
      throw new Error('REGISTRATION_ENCRYPTION_FAILED');
    }

    return {
      username: formValue.username.trim(),
      fullName: formValue.fullName.trim(),
      email: formValue.email.trim(),
      password: encryptedPassword,
      confirmPassword: encryptedConfirmPassword
    };
  }

  handleFileSelected(key: VenueOwnerDocumentKey, event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      this.fileError.set('Mỗi tài liệu không được vượt quá 2MB.');
      input.value = '';
      return;
    }

    if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
      this.fileError.set('Tài liệu chỉ nhận ảnh hoặc PDF.');
      input.value = '';
      return;
    }

    this.ownerFiles.update(files => ({ ...files, [key]: file }));
    this.fileError.set(null);
  }

  removeFile(key: VenueOwnerDocumentKey): void {
    if (this.loading()) return;
    this.ownerFiles.update(files => ({ ...files, [key]: null }));
  }

  ownerFile(key: VenueOwnerDocumentKey): File | null {
    return this.ownerFiles()[key];
  }

  private createVenueOwnerRequest(payload: RegisterRequest): VenueOwnerRegistrationRequest {
    const files = this.ownerFiles();
    const owner = this.ownerForm.getRawValue();

    return {
      ...payload,
      ...owner,
      phone: owner.phone.replace(/[\s.-]/g, ''),
      files: files as VenueOwnerRegistrationFiles
    };
  }

  private handleRegistrationSuccess(accountType: RegistrationAccountType, email: string): void {
    const message = accountType === 'VENUE_OWNER'
      ? 'Tài khoản và hồ sơ chủ sân đã được tạo. Vui lòng đăng nhập để theo dõi tiến trình duyệt.'
      : 'Tài khoản người chơi đã được tạo. Vui lòng xác thực email để tiếp tục.';

    this.registrationSucceeded.set(true);
    this.successMessage.set(message);
    this.toastService.show(message, 'success');

    timer(900).pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      if (accountType === 'VENUE_OWNER') {
        void this.router.navigate(['/login']);
        return;
      }

      void this.router.navigate(['/verify'], {
        queryParams: { email, accountType },
        queryParamsHandling: 'merge'
      });
    });
  }

  private handleRegistrationError(error: unknown): void {
    this.signUpForm.enable({ emitEvent: false });
    this.ownerForm.enable({ emitEvent: false });

    if (error instanceof Error && error.message === 'REGISTRATION_ENCRYPTION_FAILED') {
      const message = 'Không thể mã hóa mật khẩu an toàn. Vui lòng tải lại trang và thử lại.';
      this.apiError.set(message);
      this.toastService.show(message, 'error');
      return;
    }

    const apiMessage = this.extractApiMessage(error);
    const normalizedMessage = apiMessage.toLocaleLowerCase('vi');
    const duplicate = this.isDuplicateMessage(normalizedMessage);

    if (duplicate && this.isEmailMessage(normalizedMessage)) {
      this.showOwnerAccountStep();
      this.addDuplicateError('email');
      this.apiError.set('Email này đã được sử dụng. Hãy dùng email khác hoặc đăng nhập.');
      this.focusControl('email');
    } else if (duplicate && this.isUsernameMessage(normalizedMessage)) {
      this.showOwnerAccountStep();
      this.addDuplicateError('username');
      this.apiError.set('Tên đăng nhập này đã được sử dụng. Hãy chọn tên khác.');
      this.focusControl('username');
    } else if (duplicate) {
      this.showOwnerAccountStep();
      this.apiError.set('Tên đăng nhập hoặc email đã được sử dụng. Vui lòng kiểm tra lại.');
      this.focusControl('username');
    } else {
      this.apiError.set(apiMessage);
    }

    this.toastService.show(this.apiError() ?? 'Đăng ký thất bại. Vui lòng thử lại.', 'error');
    this.validationVersion.update(version => version + 1);
  }

  private extractApiMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'Không thể kết nối đến hệ thống. Vui lòng kiểm tra mạng và thử lại.';
      }

      const responseMessage = error.error?.message;
      if (Array.isArray(responseMessage)) {
        const messages = responseMessage.filter((item): item is string => typeof item === 'string');
        if (messages.length > 0) {
          return messages.join('. ');
        }
      }

      if (typeof responseMessage === 'string' && responseMessage.trim()) {
        return responseMessage.trim();
      }

      if (typeof error.error?.error === 'string' && error.error.error.trim()) {
        return error.error.error.trim();
      }

      if (error.status === 429) {
        return 'Bạn thao tác quá nhanh. Vui lòng chờ một chút rồi thử lại.';
      }
    }

    if (error instanceof Error && error.message && !error.message.startsWith('Timeout')) {
      return error.message;
    }

    return 'Đăng ký thất bại. Vui lòng thử lại.';
  }

  private getControlError(controlName: RegistrationControlName, messages: Record<string, string>): string {
    this.validationVersion();
    const control = this.signUpForm.controls[controlName];
    if ((!control.touched && !this.submitted()) || !control.errors) {
      return '';
    }

    const errorKey = Object.keys(control.errors)[0];
    return errorKey ? messages[errorKey] ?? 'Thông tin chưa hợp lệ' : '';
  }

  private clearDuplicateErrorOnChange(controlName: 'username' | 'email'): void {
    const control = this.signUpForm.controls[controlName];
    control.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const duplicateSignal = controlName === 'username'
          ? this.duplicateUsername
          : this.duplicateEmail;
        duplicateSignal.set(false);
        control.updateValueAndValidity({ emitEvent: false });
        this.apiError.set(null);
        this.validationVersion.update(version => version + 1);
      });
  }

  private addDuplicateError(controlName: 'username' | 'email'): void {
    const control = this.signUpForm.controls[controlName];
    const duplicateSignal = controlName === 'username'
      ? this.duplicateUsername
      : this.duplicateEmail;
    duplicateSignal.set(true);
    control.updateValueAndValidity({ emitEvent: false });
    control.markAsTouched();
  }

  private readInitialAccountType(): RegistrationAccountType {
    const accountType = this.route.snapshot.queryParamMap.get('accountType')?.toUpperCase();
    const role = this.route.snapshot.queryParamMap.get('role')?.toUpperCase();
    const type = this.route.snapshot.queryParamMap.get('type')?.toUpperCase();
    return accountType === 'VENUE_OWNER' || role === 'VENUE_OWNER' || type === 'OWNER'
      ? 'VENUE_OWNER'
      : 'PLAYER';
  }

  private checkPasswordStrength(password: string): number {
    if (!password) {
      return 0;
    }

    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }

  private isDuplicateMessage(message: string): boolean {
    return message.includes('đã tồn tại') ||
      message.includes('đã được sử dụng') ||
      message.includes('already exists') ||
      message.includes('duplicate') ||
      message.includes('unique constraint');
  }

  private isEmailMessage(message: string): boolean {
    return message.includes('email') || message.includes('e-mail');
  }

  private isUsernameMessage(message: string): boolean {
    return message.includes('username') ||
      message.includes('tên đăng nhập') ||
      message.includes('tên hiển thị');
  }

  private focusFirstInvalidControl(): void {
    queueMicrotask(() => {
      this.host.nativeElement.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
    });
  }

  private focusControl(controlName: 'username' | 'email'): void {
    queueMicrotask(() => {
      this.host.nativeElement.querySelector<HTMLElement>(`#register-${controlName}`)?.focus();
    });
  }

  private showOwnerAccountStep(): void {
    if (this.accountType() === 'VENUE_OWNER') {
      this.ownerStep.set(1);
    }
  }

  private getOwnerStepControls(step: OwnerRegistrationStep): AbstractControl[] {
    switch (step) {
      case 1:
        return [
          this.signUpForm.controls.fullName,
          this.signUpForm.controls.username,
          this.signUpForm.controls.email,
          this.ownerForm.controls.phone,
          this.ownerForm.controls.identityNumber
        ];
      case 2:
        return [this.signUpForm.controls.password, this.signUpForm.controls.confirmPassword];
      case 3:
        return [
          this.ownerForm.controls.businessName,
          this.ownerForm.controls.businessType,
          this.ownerForm.controls.taxCode
        ];
      case 4:
        return [
          this.ownerForm.controls.address,
          this.ownerForm.controls.ward,
          this.ownerForm.controls.district,
          this.ownerForm.controls.province,
          this.ownerForm.controls.city
        ];
      case 5:
        return [];
    }
  }

  private isOwnerSubmissionValid(): boolean {
    const missingDocument = Object.values(this.ownerFiles()).some(file => !file);
    if (missingDocument) {
      this.ownerStep.set(5);
      this.fileError.set('Vui lòng tải lên đầy đủ 4 tài liệu bắt buộc.');
      return false;
    }

    if (this.ownerForm.invalid) {
      const invalidStep = ([1, 3, 4] as const).find(step =>
        this.getOwnerStepControls(step).some(control => control.invalid)
      );
      if (invalidStep) this.ownerStep.set(invalidStep);
      return false;
    }

    return true;
  }

  private focusOwnerStepHeading(): void {
    queueMicrotask(() => {
      this.host.nativeElement.querySelector<HTMLElement>('#owner-step-title')?.focus();
    });
  }
}
