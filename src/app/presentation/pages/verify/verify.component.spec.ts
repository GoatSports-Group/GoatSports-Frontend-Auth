import { convertToParamMap, ActivatedRoute, Router, provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { LucideMail, provideLucideIcons } from '@lucide/angular';
import { of } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthService } from '@presentation/services/auth.service';
import { ToastService } from '@shared/services/toast.service';
import { VerifyComponent } from './verify.component';

describe('VerifyComponent', () => {
  const authService = {
    verify: vi.fn(),
    resendVerificationCode: vi.fn()
  };
  const toastService = { show: vi.fn() };
  let router: Router;

  beforeEach(async () => {
    authService.verify.mockReset().mockReturnValue(of({}));
    authService.resendVerificationCode.mockReset().mockReturnValue(of({}));
    toastService.show.mockReset();

    await TestBed.configureTestingModule({
      imports: [VerifyComponent],
      providers: [
        provideRouter([]),
        provideLucideIcons(LucideMail),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({
                email: 'owner@goat.vn',
                accountType: 'VENUE_OWNER'
              })
            }
          }
        },
        { provide: AuthService, useValue: authService },
        { provide: ToastService, useValue: toastService }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
  });

  it('dùng cùng form xác thực và chỉ lấy email từ URL', () => {
    const fixture = TestBed.createComponent(VerifyComponent);
    fixture.detectChanges();

    expect(fixture.componentInstance.verifyForm.value.email).toBe('owner@goat.vn');
    expect(fixture.nativeElement.querySelector('app-registration-journey-stepper')).toBeNull();

    fixture.destroy();
  });

  it('quay lại trang đăng nhập không giữ query params', () => {
    const fixture = TestBed.createComponent(VerifyComponent);
    fixture.detectChanges();
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture.componentInstance.navigateToSignIn();

    expect(navigate).toHaveBeenCalledWith(['/login']);
    fixture.destroy();
  });

  it('xác thực thành công chuyển đến URL đăng nhập thuần', async () => {
    vi.useFakeTimers();
    const fixture = TestBed.createComponent(VerifyComponent);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    component.otp.set(['1', '2', '3', '4', '5', '6']);

    component.verify();
    await vi.advanceTimersByTimeAsync(1500);

    expect(authService.verify).toHaveBeenCalledWith({
      email: 'owner@goat.vn',
      verificationCode: '123456'
    });
    expect(navigate).toHaveBeenCalledWith(['/login']);

    fixture.destroy();
    vi.useRealTimers();
  });
});
