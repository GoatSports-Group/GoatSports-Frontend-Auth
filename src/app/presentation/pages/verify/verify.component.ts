import { Component, OnInit, OnDestroy, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@presentation/services/auth.service';
import { environment } from "@environments/environment";
import { AuthCardComponent } from '@shared/components/auth-card/auth-card.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { SubmitButtonComponent } from '@shared/components/submit-button/submit-button.component';
import { RegistrationJourneyStepperComponent } from '@shared/components/registration-journey-stepper/registration-journey-stepper.component';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    AuthCardComponent,
    FormFieldComponent,
    SubmitButtonComponent,
    RegistrationJourneyStepperComponent
  ]
})
export class VerifyComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  verifyForm!: FormGroup;
  loading = signal(false);
  otp = signal<string[]>(['', '', '', '', '', '']);
  countdown = signal(60);
  isVenueOwner = signal(false);
  private timer: any;

  isOtpComplete = computed(() => {
    return this.otp().every(val => val !== '' && /^\d$/.test(val));
  });

  ngOnInit() {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.route.queryParams.subscribe(params => {
      this.isVenueOwner.set(params['accountType']?.toUpperCase() === 'VENUE_OWNER');
      if (params['email']) {
        this.verifyForm.patchValue({ email: params['email'] });
      }
    });

    this.startCountdown();
  }

  ngOnDestroy() {
    this.clearTimer();
  }

  startCountdown() {
    this.countdown.set(60);
    this.clearTimer();
    this.timer = setInterval(() => {
      if (this.countdown() > 0) {
        this.countdown.update(c => c - 1);
      } else {
        this.clearTimer();
      }
    }, 1000);
  }

  clearTimer() {
    if (this.timer) {
      clearInterval(this.timer);
    }
  }

  verify() {
    if (this.verifyForm.invalid || !this.isOtpComplete()) return;

    this.loading.set(true);

    const otpCode = this.otp().join('');
    const payload = {
      email: this.verifyForm.value.email.trim(),
      verificationCode: otpCode
    };

    this.authService.verify(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.toastService.show('Tài khoản đã được xác thực thành công! Đang chuyển hướng đăng nhập...', 'success');

        setTimeout(() => {
          this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const errorMsg = err.error?.message || 'Mã xác thực không chính xác hoặc đã hết hạn!';
        this.toastService.show(errorMsg, 'error');
      }
    });
  }

  resendCode() {
    const email = this.verifyForm.value.email?.trim();
    if (!email || this.countdown() > 0) return;

    this.authService.resendVerificationCode(email).subscribe({
      next: () => {
        this.toastService.show('Đã gửi lại mã xác thực mới tới Email của bạn.', 'success');
        this.otp.set(['', '', '', '', '', '']);
        this.startCountdown();
      },
      error: (err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || 'Không thể gửi lại mã xác thực. Vui lòng thử lại!';
        this.toastService.show(errorMsg, 'error');
      }
    });
  }

  onOtpInput(event: Event, index: number) {
    const input = event.target as HTMLInputElement;
    let val = input.value;

    // Filter non-numeric characters
    if (val && !/^\d$/.test(val)) {
      val = '';
      input.value = '';
    }

    const currentOtp = [...this.otp()];
    currentOtp[index] = val;
    this.otp.set(currentOtp);

    // Auto focus next input
    if (val && index < 5) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    // Backspace key: focus previous input and clear its value
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = input.previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();

        const currentOtp = [...this.otp()];
        currentOtp[index - 1] = '';
        this.otp.set(currentOtp);
      }
    }
  }

  navigateToSignIn() {
    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }

  navigateToHome() {
    window.location.href = environment.clientApiUrl;
  }
}
