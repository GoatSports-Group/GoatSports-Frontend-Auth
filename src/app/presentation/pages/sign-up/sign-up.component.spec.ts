import { HttpErrorResponse } from '@angular/common/http';
import { provideRouter, Router } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  LucideLock,
  LucideMail,
  LucideUser,
  LucideUserCheck,
  provideLucideIcons
} from '@lucide/angular';
import { RegisterRequest } from '@application/dto/auth/auth.dto';
import { AuthService } from '@presentation/services/auth.service';
import { CryptoService } from '@presentation/services/crypto.service';
import { ToastService } from '@shared/services/toast.service';
import { SignUpComponent } from './sign-up.component';

describe('SignUpComponent', () => {
  const verifySession = {
    processInstanceKey: 991,
    registrationAccessToken: 'registration-token',
    taskKey: 11
  };
  const applicationSession = { ...verifySession, taskKey: 22 };
  const authService = {
    register: vi.fn(),
    startVenueOwnerRegistration: vi.fn(),
    verifyVenueOwnerEmail: vi.fn(),
    resendVerificationCode: vi.fn(),
    submitVenueOwnerApplication: vi.fn()
  };
  const cryptoService = {
    getPublicKey: vi.fn(),
    encrypt: vi.fn()
  };
  const toastService = { show: vi.fn() };

  let router: Router;

  beforeEach(async () => {
    Object.values(authService).forEach(mock => mock.mockReset());
    cryptoService.getPublicKey.mockReset();
    cryptoService.encrypt.mockReset();
    toastService.show.mockReset();

    cryptoService.getPublicKey.mockReturnValue(of('public-key'));
    cryptoService.encrypt.mockImplementation((value: string) => `encrypted-${value}`);
    authService.register.mockReturnValue(of({}));
    authService.startVenueOwnerRegistration.mockReturnValue(of(verifySession));
    authService.verifyVenueOwnerEmail.mockReturnValue(of(applicationSession));
    authService.resendVerificationCode.mockReturnValue(of(void 0));
    authService.submitVenueOwnerApplication.mockReturnValue(of(void 0));

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

  afterEach(() => vi.useRealTimers());

  it('không submit PLAYER khi form chưa hợp lệ và hiển thị validation inline', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    component.signUpForm.setValue({
      username: '  ', fullName: ' ', email: 'email-sai', password: 'weak', confirmPassword: 'different'
    });

    component.register();
    fixture.detectChanges();

    expect(cryptoService.getPublicKey).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Tên đăng nhập cần ít nhất 3 ký tự');
    expect(fixture.nativeElement.textContent).toContain('Email chưa đúng định dạng');
    expect(fixture.nativeElement.textContent).toContain('Mật khẩu xác nhận không khớp');
  });

  it('hiển thị popup loading và chặn double click khi đăng ký PLAYER', () => {
    const pendingRegistration = new Subject<object>();
    authService.register.mockReturnValue(pendingRegistration);
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    component.register();
    fixture.detectChanges();

    expect(authService.register).toHaveBeenCalledTimes(1);
    expect(component.signUpForm.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('app-screen-loader')?.textContent)
      .toContain('Đang tạo tài khoản người chơi');
  });

  it('gửi đúng contract PLAYER rồi chuyển sang trang verify', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    fixture.detectChanges();

    const payload = authService.register.mock.calls[0][0] as RegisterRequest & Record<string, unknown>;
    expect(payload).toEqual({
      username: 'goat.player',
      fullName: 'Nguyễn Minh',
      email: 'player@example.com',
      password: 'encrypted-Strong@123',
      confirmPassword: 'encrypted-Strong@123'
    });
    expect(payload['role']).toBeUndefined();
    await vi.advanceTimersByTimeAsync(900);
    expect(navigateSpy).toHaveBeenCalledWith(['/verify'], {
      queryParams: { email: 'player@example.com', accountType: 'PLAYER' },
      queryParamsHandling: 'merge'
    });
  });

  it('hiển thị đúng wizard bốn bước và gom password vào bước Tài khoản', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Tài khoản');
    expect(fixture.nativeElement.textContent).toContain('Xác thực');
    expect(fixture.nativeElement.textContent).toContain('Thông tin cơ sở');
    expect(fixture.nativeElement.textContent).toContain('Hồ sơ chủ sân');
    expect(fixture.nativeElement.textContent).toContain('Bước 1/4');
    expect(fixture.nativeElement.querySelector('#register-password')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#register-phone')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#register-identityNumber')).not.toBeNull();
  });

  it('bước 1 chỉ gửi dữ liệu tài khoản vào workflow rồi hiển thị OTP', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);
    fixture.detectChanges();

    component.register();
    fixture.detectChanges();

    expect(authService.startVenueOwnerRegistration).toHaveBeenCalledTimes(1);
    expect(authService.startVenueOwnerRegistration.mock.calls[0][0]).toEqual({
      username: 'goat.player',
      fullName: 'Nguyễn Minh',
      email: 'player@example.com',
      password: 'encrypted-Strong@123',
      confirmPassword: 'encrypted-Strong@123',
      phone: '0901234567',
      identityNumber: '012345678901'
    });
    expect(component.ownerStep()).toBe(2);
    expect(fixture.nativeElement.querySelector('#owner-otp-0')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('player@example.com');
    expect(authService.submitVenueOwnerApplication).not.toHaveBeenCalled();
  });

  it('xác thực OTP trước khi mở bước Thông tin cơ sở', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);
    component.register();
    component.ownerOtp.set(['1', '2', '3', '4', '5', '6']);

    component.register();
    fixture.detectChanges();

    expect(authService.verifyVenueOwnerEmail).toHaveBeenCalledWith({
      email: 'player@example.com', verificationCode: '123456'
    }, verifySession);
    expect(component.ownerStep()).toBe(3);
    expect(fixture.nativeElement.querySelector('#register-businessName')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#register-address')).not.toBeNull();
  });

  it('gửi hồ sơ ở bước 4 rồi chuyển về login', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);
    component.register();
    component.ownerOtp.set(['1', '2', '3', '4', '5', '6']);
    component.register();
    component.nextOwnerStep();

    component.register();
    fixture.detectChanges();

    expect(authService.submitVenueOwnerApplication).toHaveBeenCalledTimes(1);
    expect(authService.submitVenueOwnerApplication.mock.calls[0][0]).toEqual(applicationSession);
    expect(authService.submitVenueOwnerApplication.mock.calls[0][1]).toMatchObject({
      businessName: 'GOAT Arena', address: '12 Nguyễn Văn Bảo'
    });
    expect(component.registrationSucceeded()).toBe(true);
    await vi.advanceTimersByTimeAsync(900);
    expect(navigateSpy).toHaveBeenCalledWith(['/login']);
  });

  it('đưa VENUE_OWNER về bước tài khoản khi workflow báo email trùng', () => {
    authService.startVenueOwnerRegistration.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { message: 'Email đã tồn tại' }
    })));
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);

    component.register();
    fixture.detectChanges();

    expect(component.ownerStep()).toBe(1);
    expect(component.signUpForm.controls.email.hasError('duplicate')).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Email này đã được sử dụng');
  });

  it('không gửi password thô khi mã hóa VENUE_OWNER thất bại', () => {
    cryptoService.encrypt.mockImplementation((value: string) => value);
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);

    component.register();
    fixture.detectChanges();

    expect(authService.startVenueOwnerRegistration).not.toHaveBeenCalled();
    expect(component.apiError()).toContain('Không thể mã hóa mật khẩu an toàn');
    expect(component.signUpForm.enabled).toBe(true);
  });
});

function fillValidForm(component: SignUpComponent): void {
  component.signUpForm.setValue({
    username: 'goat.player',
    fullName: '  Nguyễn Minh  ',
    email: 'player@example.com',
    password: 'Strong@123',
    confirmPassword: 'Strong@123'
  });
}

function fillValidOwnerRegistration(component: SignUpComponent): void {
  fillValidForm(component);
  component.ownerForm.setValue({
    phone: '0901234567',
    identityNumber: '012345678901',
    businessName: 'GOAT Arena',
    businessType: 'COMPANY',
    taxCode: '0123456789',
    address: '12 Nguyễn Văn Bảo',
    province: 'TP. Hồ Chí Minh',
    district: 'Gò Vấp',
    ward: 'Phường 4',
    city: 'TP. Hồ Chí Minh'
  });
  const file = new File(['goat'], 'document.png', { type: 'image/png' });
  component.ownerFiles.set({
    idCardFront: file,
    idCardBack: file,
    businessLicense: file,
    venueImage: file
  });
}
