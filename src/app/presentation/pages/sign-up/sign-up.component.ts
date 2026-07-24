import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, ValidatorFn, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '@presentation/services/auth.service';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/services/toast.service';
import { LucideAngularModule } from 'lucide-angular';

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
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, LucideAngularModule]
})
export class SignUpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  signUpForm!: FormGroup;
  loading = signal(false);
  hidePassword = signal(true);
  hideConfirmPassword = signal(true);
  passwordStrength = signal<number>(0);

  ngOnInit() {
    this.signUpForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      fullName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: passwordMatchValidator });

    // Track password changes to calculate password strength
    this.signUpForm.get('password')?.valueChanges.subscribe(pwd => {
      this.passwordStrength.set(this.checkPasswordStrength(pwd || ''));
    });
  }

  checkPasswordStrength(pwd: string): number {
    let score = 0;
    if (!pwd) return 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  }

  register() {
    if (this.signUpForm.invalid) return;

    this.loading.set(true);

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
        this.loading.set(false);
        this.toastService.show(`Đăng ký thành công tài khoản ${payload.username}! Vui lòng xác thực email.`, 'success');

        setTimeout(() => {
          this.router.navigate(['/verify'], { queryParams: { email: targetEmail }, queryParamsHandling: 'merge' });
        }, 1500);
      },
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        const errorMsg = err.error?.message || 'Đăng ký thất bại. Vui lòng thử lại!';
        this.toastService.show(errorMsg, 'error');
      }
    });
  }

  navigateToSignIn() {
    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }
}
