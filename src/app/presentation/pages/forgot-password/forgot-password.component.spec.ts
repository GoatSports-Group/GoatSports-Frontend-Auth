import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideLucideIcons, LucideLock, LucideMail } from '@lucide/angular';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { ToastService } from '@shared/services/toast.service';
import { ForgotPasswordComponent } from './forgot-password.component';

describe('ForgotPasswordComponent', () => {
  const authService = { forgotPassword: vi.fn() };
  const cryptoService = { getPublicKey: vi.fn(), encrypt: vi.fn() };
  const toastService = { show: vi.fn() };

  beforeEach(async () => {
    authService.forgotPassword.mockReset().mockReturnValue(of(undefined));
    cryptoService.getPublicKey.mockReset().mockReturnValue(of('public-key'));
    cryptoService.encrypt.mockReset().mockImplementation((value: string) => `encrypted-${value}`);
    toastService.show.mockReset();

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        provideLucideIcons(LucideMail, LucideLock),
        { provide: AuthService, useValue: authService },
        { provide: CryptoService, useValue: cryptoService },
        { provide: ToastService, useValue: toastService }
      ]
    }).compileComponents();
  });

  it('cập nhật thanh độ mạnh mật khẩu tới 4/4', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();

    fixture.componentInstance.forgotForm.patchValue({ password: 'Strong@123' });
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('4/4');
    expect(fixture.nativeElement.querySelectorAll('.bg-emerald-500')).toHaveLength(4);
  });

  it('hiển thị lỗi password và confirm password dưới thanh độ mạnh bằng màu danger', () => {
    const fixture = TestBed.createComponent(ForgotPasswordComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.forgotForm.patchValue({ password: 'weak', confirmPassword: 'different' });
    component.forgotForm.controls['password'].markAsTouched();
    component.forgotForm.controls['confirmPassword'].markAsTouched();
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('#forgot-password-validation-errors') as HTMLElement;
    expect(error).not.toBeNull();
    expect(error.classList.contains('text-rose-600')).toBe(true);
    expect(error.textContent).toContain('Mật khẩu cần ít nhất 8 ký tự');
    expect(error.textContent).toContain('Mật khẩu xác nhận không khớp');
  });
});
