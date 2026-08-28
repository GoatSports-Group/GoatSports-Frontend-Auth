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
  const authService = {
    register: vi.fn(),
    registerVenueOwner: vi.fn()
  };
  const cryptoService = {
    getPublicKey: vi.fn(),
    encrypt: vi.fn()
  };
  const toastService = {
    show: vi.fn()
  };

  let router: Router;

  beforeEach(async () => {
    authService.register.mockReset();
    authService.registerVenueOwner.mockReset();
    cryptoService.getPublicKey.mockReset();
    cryptoService.encrypt.mockReset();
    toastService.show.mockReset();

    cryptoService.getPublicKey.mockReturnValue(of('public-key'));
    cryptoService.encrypt.mockImplementation((value: string) => `encrypted-${value}`);
    authService.register.mockReturnValue(of({}));
    authService.registerVenueOwner.mockReturnValue(of(void 0));

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

  afterEach(() => {
    vi.useRealTimers();
  });

  it('không submit khi form chưa hợp lệ và hiển thị validation inline', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    component.signUpForm.setValue({
      username: '  ',
      fullName: ' ',
      email: 'email-sai',
      password: 'weak',
      confirmPassword: 'different'
    });

    component.register();
    fixture.detectChanges();

    expect(component.signUpForm.invalid).toBe(true);
    expect(cryptoService.getPublicKey).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Tên đăng nhập cần ít nhất 3 ký tự');
    expect(fixture.nativeElement.textContent).toContain('Email chưa đúng định dạng');
    expect(fixture.nativeElement.textContent).toContain('Mật khẩu xác nhận không khớp');
  });

  it('hiển thị popup loading trong khi đăng ký PLAYER', () => {
    const pendingRegistration = new Subject<object>();
    authService.register.mockReturnValue(pendingRegistration);
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    fixture.detectChanges();

    const loader = fixture.nativeElement.querySelector('app-screen-loader');
    expect(loader).not.toBeNull();
    expect(loader.textContent).toContain('Đang tạo tài khoản người chơi');

    pendingRegistration.next({});
    pendingRegistration.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-screen-loader')).toBeNull();
  });

  it('hiển thị popup loading trong khi đăng ký VENUE_OWNER', () => {
    const pendingRegistration = new Subject<void>();
    authService.registerVenueOwner.mockReturnValue(pendingRegistration);
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);
    fixture.detectChanges();

    for (let step = 1; step < 5; step += 1) component.nextOwnerStep();
    component.register();
    fixture.detectChanges();

    const loader = fixture.nativeElement.querySelector('app-screen-loader');
    expect(loader).not.toBeNull();
    expect(loader.textContent).toContain('Đang tạo hồ sơ chủ sân');

    pendingRegistration.next();
    pendingRegistration.complete();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-screen-loader')).toBeNull();
  });

  it(
    'gửi đúng contract 5 field cho PLAYER rồi chuyển sang verify',
    async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(SignUpComponent);
      const component = fixture.componentInstance;
      const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
      fixture.detectChanges();

      fillValidForm(component);

      component.register();
      fixture.detectChanges();

      expect(authService.register).toHaveBeenCalledTimes(1);
      const payload = authService.register.mock.calls[0][0] as RegisterRequest & Record<string, unknown>;
      expect(payload).toEqual({
        username: 'goat.player',
        fullName: 'Nguyễn Minh',
        email: 'player@example.com',
        password: 'encrypted-Strong@123',
        confirmPassword: 'encrypted-Strong@123'
      });
      expect(payload['role']).toBeUndefined();
      expect(payload['businessName']).toBeUndefined();
      expect(component.registrationSucceeded()).toBe(true);
      expect(fixture.nativeElement.textContent).toContain('Đăng ký thành công');

      await vi.advanceTimersByTimeAsync(900);

      expect(navigateSpy).toHaveBeenCalledWith(['/verify'], {
        queryParams: { email: 'player@example.com', accountType: 'PLAYER' },
        queryParamsHandling: 'merge'
      });
    }
  );

  it('dùng step progress như owner application và chỉ mở bước bảo mật khi bước tài khoản hợp lệ', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fixture.detectChanges();

    expect(component.ownerStep()).toBe(1);
    expect(fixture.nativeElement.querySelector('[data-testid="owner-registration-stepper"]')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Xác thực');
    expect(fixture.nativeElement.textContent).toContain('Địa chỉ sân');
    expect(fixture.nativeElement.textContent).toContain('Hồ sơ chủ sân');
    expect(fixture.nativeElement.querySelector('#register-password')).toBeNull();

    component.nextOwnerStep();
    fixture.detectChanges();

    expect(component.ownerStep()).toBe(1);
    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('#register-fullName')).not.toBeNull();

    fillValidOwnerRegistration(component);
    component.nextOwnerStep();
    fixture.detectChanges();

    expect(component.ownerStep()).toBe(2);
    expect(fixture.nativeElement.querySelector('#register-fullName')).toBeNull();
    expect(fixture.nativeElement.querySelector('#register-password')).not.toBeNull();
    expect(authService.register).not.toHaveBeenCalled();
  });

  it('chạy workflow VENUE_OWNER sau đủ 5 bước rồi chuyển về login', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.setAccountType('VENUE_OWNER');
    navigateSpy.mockClear();
    fillValidOwnerRegistration(component);

    try {
      for (let step = 1; step < 5; step += 1) component.nextOwnerStep();
      component.register();
      fixture.detectChanges();

      expect(authService.registerVenueOwner).toHaveBeenCalledTimes(1);
      expect(authService.register).not.toHaveBeenCalled();
      expect(authService.registerVenueOwner.mock.calls[0][0]).toMatchObject({
        username: 'goat.player',
        businessName: 'GOAT Arena',
        address: '12 Nguyễn Văn Bảo',
        password: 'encrypted-Strong@123'
      });
      expect(component.registrationSucceeded()).toBe(true);

      await vi.advanceTimersByTimeAsync(900);
      expect(navigateSpy).toHaveBeenCalledWith(['/login']);
      expect(navigateSpy).not.toHaveBeenCalledWith(['/verify'], expect.anything());
    } finally {
      vi.useRealTimers();
    }
  });

  it('cho phép quay lại bước tài khoản và giữ nguyên dữ liệu đã nhập', () => {
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);
    component.nextOwnerStep();
    fixture.detectChanges();

    component.previousOwnerStep();
    fixture.detectChanges();

    expect(component.ownerStep()).toBe(1);
    expect(component.signUpForm.getRawValue().email).toBe('player@example.com');
    expect(fixture.nativeElement.querySelector('#register-email')).not.toBeNull();
  });

  it('đưa VENUE_OWNER về bước tài khoản khi API báo email trùng', () => {
    authService.registerVenueOwner.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { message: 'Email đã tồn tại' }
    })));
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    component.setAccountType('VENUE_OWNER');
    fillValidOwnerRegistration(component);
    for (let step = 1; step < 5; step += 1) component.nextOwnerStep();

    component.register();
    fixture.detectChanges();

    expect(component.ownerStep()).toBe(1);
    expect(component.apiError()).toContain('Email này đã được sử dụng');
    expect(component.signUpForm.controls.email.hasError('duplicate')).toBe(true);
    expect(fixture.nativeElement.querySelector('#register-email')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Email này đã được sử dụng');
  });

  it('khóa form và chặn double click gửi hai request đồng thời', () => {
    const publicKeyResponse = new Subject<string>();
    cryptoService.getPublicKey.mockReturnValue(publicKeyResponse.asObservable());
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    component.register();
    fixture.detectChanges();

    expect(component.loading()).toBe(true);
    expect(component.signUpForm.disabled).toBe(true);
    expect(cryptoService.getPublicKey).toHaveBeenCalledTimes(1);
    expect(authService.register).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('button[type="submit"]')?.disabled).toBe(true);
  });

  it.each([
    ['Email đã tồn tại', 'email', 'Email này đã được sử dụng'],
    ['Tên đăng nhập đã tồn tại', 'username', 'Tên đăng nhập này đã được sử dụng']
  ])('hiển thị duplicate API error cho %s', (message, controlName, expectedText) => {
    authService.register.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400,
      error: { message }
    })));
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    fixture.detectChanges();

    expect(component.loading()).toBe(false);
    expect(component.signUpForm.enabled).toBe(true);
    expect(component.signUpForm.get(controlName)?.hasError('duplicate')).toBe(true);
    expect(component.apiError()).toContain(expectedText);
    expect(fixture.nativeElement.textContent).toContain(expectedText);
  });

  it('hiển thị lỗi mạng dễ hiểu và cho phép submit lại', () => {
    authService.register.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 0 })));
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    fixture.detectChanges();

    expect(component.registrationSucceeded()).toBe(false);
    expect(component.apiError()).toContain('Không thể kết nối');
    expect(component.signUpForm.enabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain('Không thể kết nối');
  });

  it('không gửi password thô khi mã hóa thất bại', () => {
    cryptoService.encrypt.mockImplementation((value: string) => value);
    const fixture = TestBed.createComponent(SignUpComponent);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    fillValidForm(component);

    component.register();
    fixture.detectChanges();

    expect(authService.register).not.toHaveBeenCalled();
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
