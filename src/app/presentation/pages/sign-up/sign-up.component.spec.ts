import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { provideLucideIcons, LucideLock, LucideMail, LucideUser, LucideUserCheck } from '@lucide/angular';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { ToastService } from '@shared/services/toast.service';
import { SignUpComponent } from './sign-up.component';

describe('SignUpComponent', () => {
  const authService = { register: vi.fn() };
  const cryptoService = { getPublicKey: vi.fn(), encrypt: vi.fn() };
  const toastService = { show: vi.fn() };
  let router: Router;

  beforeEach(async () => {
    authService.register.mockReset().mockReturnValue(of({}));
    cryptoService.getPublicKey.mockReset().mockReturnValue(of('public-key'));
    cryptoService.encrypt.mockReset().mockImplementation((value: string) => `encrypted-${value}`);
    toastService.show.mockReset();
    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideRouter([]),
        provideLucideIcons(LucideMail, LucideUser, LucideUserCheck, LucideLock),
        { provide: AuthService, useValue: authService },
        { provide: CryptoService, useValue: cryptoService },
        { provide: ToastService, useValue: toastService }
      ]
    }).compileComponents();
    router = TestBed.inject(Router);
  });

  it('không gửi request khi form không hợp lệ', () => {
    const component = createComponent();
    component.signUpForm.setValue({
      username: ' ', fullName: '', email: 'sai', password: 'weak', confirmPassword: 'different'
    });
    component.register();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('PLAYER dùng endpoint register và không gửi password thô', () => {
    const component = createComponent();
    fillForm(component);
    component.register();
    expect(authService.register).toHaveBeenCalledOnce();
    expect(authService.register.mock.calls[0][0]).toMatchObject({
      accountType: 'PLAYER', username: 'goat.player',
      password: 'encrypted-Strong@123', confirmPassword: 'encrypted-Strong@123'
    });
  });

  it('VENUE_OWNER đăng ký qua Auth rồi chuyển sang verify', async () => {
    vi.useFakeTimers();
    const component = createComponent();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.setAccountType('VENUE_OWNER');
    fillForm(component);
    component.register();
    await vi.advanceTimersByTimeAsync(700);
    expect(authService.register).toHaveBeenCalledOnce();
    expect(authService.register.mock.calls[0][0]).toMatchObject({ accountType: 'VENUE_OWNER' });
    expect(navigate).toHaveBeenCalledWith(['/verify'], expect.objectContaining({
      queryParams: { email: 'owner@goat.vn', accountType: 'VENUE_OWNER' }
    }));
    vi.useRealTimers();
  });

  it('chặn double click khi request đang xử lý', () => {
    const pending = new Subject<object>();
    authService.register.mockReturnValue(pending);
    const component = createComponent();
    component.setAccountType('VENUE_OWNER');
    fillForm(component);
    component.register();
    component.register();
    expect(authService.register).toHaveBeenCalledOnce();
    expect(component.loading()).toBe(true);
    expect(component.signUpForm.disabled).toBe(true);
  });

  it('hiển thị lỗi API duplicate và mở lại form', () => {
    authService.register.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 409, error: { message: 'Người dùng đã tồn tại' }
    })));
    const component = createComponent();
    component.setAccountType('VENUE_OWNER');
    fillForm(component);
    component.register();
    expect(component.apiError()).toContain('đã được sử dụng');
    expect(component.signUpForm.enabled).toBe(true);
  });

  function createComponent(): SignUpComponent {
    const fixture = TestBed.createComponent(SignUpComponent);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  function fillForm(component: SignUpComponent): void {
    component.signUpForm.setValue({
      username: 'goat.player', fullName: 'Nguyễn Minh', email: 'owner@goat.vn',
      password: 'Strong@123', confirmPassword: 'Strong@123'
    });
  }
});
