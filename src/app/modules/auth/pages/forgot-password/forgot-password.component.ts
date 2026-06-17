import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../../core/services/index';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);
  private authService = inject(AuthService);

  forgotForm: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  constructor() {
    this.forgotForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordMatchValidator(g: FormGroup) {
    const password = g.get('password');
    const confirmPassword = g.get('confirmPassword');

    if (!password || !confirmPassword) return null;

    if (password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ ...confirmPassword.errors, mismatch: true });
      return { mismatch: true };
    } else {
      if (confirmPassword.hasError('mismatch')) {
        const errors = { ...confirmPassword.errors };
        delete errors['mismatch'];
        confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
      }
      return null;
    }
  }

  onSubmitStep1() {
    if (this.forgotForm.invalid) return;

    this.loading = true;

    const email = this.forgotForm.value.email.trim();
    const payload = {
      email: email,
      password: this.forgotForm.value.password,
      confirmPassword: this.forgotForm.value.confirmPassword
    };

    this.authService.forgotPassword(payload).subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open('Mã xác thực 6 chữ số đã được gửi tới Email của bạn!', 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });

        // Redirect directly to verify page with email query parameter
        setTimeout(() => {
          this.router.navigate(['/verify'], { queryParams: { email: email }, queryParamsHandling: 'merge' });
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const errorMsg = err.error?.message || 'Có lỗi xảy ra. Vui lòng thử lại!';
        this.snackBar.open(errorMsg, 'Đóng', {
          duration: 1000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-error']
        });
      }
    });
  }

  navigateToSignIn() {
    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }
}
