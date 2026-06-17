import { Component, OnInit, inject } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../../core/services/index';
import { HttpErrorResponse } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';

export const passwordMatchValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const password = control.get('password');
  const confirmPassword = control.get('confirmPassword');
  
  if (!password || !confirmPassword) return null;

  if (password.value !== confirmPassword.value) {
    confirmPassword.setErrors({ ...confirmPassword.errors, passwordMismatch: true });
    return { passwordMismatch: true };
  } else {
    if (confirmPassword.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length > 0 ? errors : null);
    }
    return null;
  }
};

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.component.html',
  styleUrls: ['./sign-up.component.scss']
})
export class SignUpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private snackBar = inject(MatSnackBar);

  signUpForm!: FormGroup;
  loading = false;
  hidePassword = true;
  hideConfirmPassword = true;

  ngOnInit() {
    this.signUpForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });
  }

  register() {
    if (this.signUpForm.invalid) return;

    this.loading = true;

    const payload = {
      username: this.signUpForm.value.username.trim(),
      fullName: this.signUpForm.value.fullName.trim(),
      email: this.signUpForm.value.email.trim(),
      password: this.signUpForm.value.password,
      confirmPassword: this.signUpForm.value.confirmPassword
    };

    const targetEmail = payload.email;

    this.authService.register(payload).subscribe({
      next: () => {
        this.loading = false;
        
        this.snackBar.open(`Đăng ký thành công tài khoản ${payload.username}! Vui lòng xác thực email.`, 'Đóng', {
          duration: 4000,
          horizontalPosition: 'end',
          verticalPosition: 'top',
          panelClass: ['snackbar-success']
        });

        setTimeout(() => {
          this.router.navigate(['/verify'], { queryParams: { email: targetEmail }, queryParamsHandling: 'merge' });
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        const errorMsg = err.error?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
        this.snackBar.open(errorMsg, 'Đóng', {
          duration: 4000,
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
