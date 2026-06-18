import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-verify',
  templateUrl: './verify.component.html',
  styleUrls: ['./verify.component.scss']
})
export class VerifyComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  verifyForm!: FormGroup;
  loading = false;
  otp: string[] = ['', '', '', '', '', ''];
  countdown = 60;
  private timer: any;

  ngOnInit() {
    this.verifyForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    this.route.queryParams.subscribe(params => {
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
    this.countdown = 60;
    this.clearTimer();
    this.timer = setInterval(() => {
      if (this.countdown > 0) {
        this.countdown--;
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
    if (this.verifyForm.invalid || !this.isOtpComplete) return;

    this.loading = true;

    const otpCode = this.otp.join('');
    const payload = {
      email: this.verifyForm.value.email.trim(),
      verificationCode: otpCode
    };

    this.authService.verify(payload).subscribe({
      next: () => {
        this.loading = false;

        this.snackBar.open('Tài khoản đã được xác thực thành công! Đang chuyển hướng đăng nhập...', 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });

        setTimeout(() => {
          this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const errorMsg = err.error?.message || 'Mã xác thực không chính xác hoặc đã hết hạn!';
        this.snackBar.open(errorMsg, 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  resendCode() {
    const email = this.verifyForm.value.email?.trim();
    if (!email || this.countdown > 0) return;

    this.authService.resendVerificationCode(email).subscribe({
      next: () => {
        this.snackBar.open('Đã gửi lại mã xác thực mới tới Email của bạn.', 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });
        this.otp = ['', '', '', '', '', ''];
        this.startCountdown();
      },
      error: (err: HttpErrorResponse) => {
        const errorMsg = err.error?.message || 'Không thể gửi lại mã xác thực. Vui lòng thử lại!';
        this.snackBar.open(errorMsg, 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  onOtpKeyUp(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Auto focus next input
    if (value && index < 5) {
      const nextInput = input.nextElementSibling as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  }

  onOtpKeyDown(event: KeyboardEvent, index: number) {
    const input = event.target as HTMLInputElement;

    // Backspace key: focus previous input
    if (event.key === 'Backspace' && !input.value && index > 0) {
      const prevInput = input.previousElementSibling as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        prevInput.value = '';
        this.otp[index - 1] = '';
      }
    }
  }

  get isOtpComplete(): boolean {
    return this.otp.every(val => val !== '' && /^\d$/.test(val));
  }

  navigateToSignIn() {
    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }

  navigateToHome() {
    window.location.href = import.meta.env.NG_APP_CLIENT_API_URL;
  }
}
