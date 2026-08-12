import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { ToastService } from '@shared/services/toast.service';
import { AuthService } from '@presentation/services/auth.service';
import { AuthCardComponent } from '@shared/components/auth-card/auth-card.component';
import { FormFieldComponent } from '@shared/components/form-field/form-field.component';
import { PasswordInputComponent } from '@shared/components/password-input/password-input.component';
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
    SubmitButtonComponent
  ]
})
export class ForgotPasswordComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  forgotForm: FormGroup;
  loading = signal(false);

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
    if (this.forgotForm.invalid) return;

    this.loading.set(true);

    const email = this.forgotForm.value.email.trim();
    const payload = {
      email: email,
      password: this.forgotForm.value.password,
      confirmPassword: this.forgotForm.value.confirmPassword
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
  }

  navigateToSignIn() {
    this.router.navigate(['/login'], { queryParamsHandling: 'preserve' });
  }
}
