import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  provideLucideIcons, LucideCircleCheck, LucideMailCheck, LucideSend, LucideShieldAlert, LucideX
} from '@lucide/angular';
import { AccountStatusError } from '@application/dto/auth/auth.dto';
import { AuthService } from '@presentation/services/auth.service';
import { AccountStatusDialogComponent } from './account-status-dialog.component';
import { convertToParamMap } from '@angular/router';
import { accountStatusFrom, blockedStatusFromQuery } from './sign-in.component';

const INACTIVE: AccountStatusError = { code: 'ACCOUNT_INACTIVE', email: 'chua.kich.hoat@goat.test', codeSent: true };
const BLOCKED: AccountStatusError = {
  code: 'ACCOUNT_BLOCKED', email: 'bi.khoa@goat.test', fullName: 'Người Bị Khóa', appealToken: 'tok', appealTtlMinutes: 30
};

describe('accountStatusFrom', () => {
  it('đọc mã ACCOUNT_INACTIVE / ACCOUNT_BLOCKED từ lỗi 403 của đăng nhập', () => {
    const inactive = new HttpErrorResponse({ status: 403, error: { error: 'ACCOUNT_INACTIVE', data: { email: 'a@b.c', codeSent: false } } });
    expect(accountStatusFrom(inactive)).toEqual({ code: 'ACCOUNT_INACTIVE', email: 'a@b.c', codeSent: false });

    const blocked = new HttpErrorResponse({
      status: 403, error: { error: 'ACCOUNT_BLOCKED', data: { email: 'a@b.c', fullName: 'A', appealToken: 't', appealTtlMinutes: 30 } }
    });
    expect(accountStatusFrom(blocked)).toEqual({ code: 'ACCOUNT_BLOCKED', email: 'a@b.c', fullName: 'A', appealToken: 't', appealTtlMinutes: 30 });
  });

  it('lỗi khác (sai mật khẩu, 400, thiếu dữ liệu) thì không mở popup', () => {
    expect(accountStatusFrom(new HttpErrorResponse({ status: 400, error: { message: 'Sai mật khẩu' } }))).toBeNull();
    expect(accountStatusFrom(new HttpErrorResponse({ status: 403, error: { error: 'ACCOUNT_BLOCKED', data: {} } }))).toBeNull();
  });
});

describe('blockedStatusFromQuery', () => {
  it('mở popup khiếu nại khi Google chuyển về với tài khoản bị khóa', () => {
    expect(blockedStatusFromQuery(convertToParamMap({ account: 'blocked', appealToken: 't', email: 'a@b.c', fullName: 'A' })))
      .toEqual({ code: 'ACCOUNT_BLOCKED', email: 'a@b.c', fullName: 'A', appealToken: 't', appealTtlMinutes: 30 });
    expect(blockedStatusFromQuery(convertToParamMap({ account: 'blocked', email: 'a@b.c' }))).toBeNull();
    expect(blockedStatusFromQuery(convertToParamMap({}))).toBeNull();
  });

  it('mở popup nhập OTP khi Google chuyển về với tài khoản chưa xác thực', () => {
    expect(blockedStatusFromQuery(convertToParamMap({ account: 'inactive', email: 'a@b.c', codeSent: 'true' })))
      .toEqual({ code: 'ACCOUNT_INACTIVE', email: 'a@b.c', codeSent: true });
    expect(blockedStatusFromQuery(convertToParamMap({ account: 'inactive' }))).toBeNull();
  });
});

describe('AccountStatusDialogComponent', () => {
  const authService = { submitAccountAppeal: vi.fn() };

  beforeEach(async () => {
    authService.submitAccountAppeal.mockReset().mockReturnValue(of(undefined));
    await TestBed.configureTestingModule({
      imports: [AccountStatusDialogComponent],
      providers: [
        provideLucideIcons(LucideMailCheck, LucideShieldAlert, LucideSend, LucideX, LucideCircleCheck),
        { provide: AuthService, useValue: authService }
      ]
    }).compileComponents();
  });

  function render(status: AccountStatusError) {
    const fixture = TestBed.createComponent(AccountStatusDialogComponent);
    fixture.componentRef.setInput('status', status);
    fixture.detectChanges();
    return fixture;
  }

  function button(fixture: ReturnType<typeof render>, label: string): HTMLButtonElement {
    const found = Array.from(fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>)
      .find(item => item.textContent?.trim().includes(label));
    expect(found, `nút "${label}"`).toBeTruthy();
    return found!;
  }

  it('tài khoản chưa kích hoạt: báo đã gửi OTP và "Xác thực" chuyển sang trang nhập mã với email', () => {
    const fixture = render(INACTIVE);
    const verify = vi.fn();
    fixture.componentInstance.verify.subscribe(verify);

    expect(fixture.nativeElement.textContent).toContain('Tài khoản chưa được kích hoạt');
    expect(fixture.nativeElement.textContent).toContain('gửi mã OTP');
    button(fixture, 'Xác thực').click();
    expect(verify).toHaveBeenCalledWith(INACTIVE.email);
  });

  it('tài khoản bị khóa: soạn thư như email, gửi kèm mã khiếu nại và hiện xác nhận', () => {
    const fixture = render(BLOCKED);
    const component = fixture.componentInstance;
    expect(fixture.nativeElement.textContent).toContain('Tài khoản đã bị khóa');
    expect(fixture.nativeElement.textContent).toContain('Ban quản trị GOAT Sports');
    expect(button(fixture, 'Gửi thư').disabled).toBe(true);  // nội dung còn trống

    component.message = 'Tôi bị khóa nhầm, xin xem xét lại giúp tôi.';
    fixture.detectChanges();
    component.sendAppeal();
    fixture.detectChanges();

    expect(authService.submitAccountAppeal).toHaveBeenCalledWith({
      appealToken: 'tok', subject: 'Yêu cầu mở khóa tài khoản', message: 'Tôi bị khóa nhầm, xin xem xét lại giúp tôi.'
    });
    expect(fixture.nativeElement.textContent).toContain('Đã gửi thư tới quản trị viên');
  });

  it('gửi lỗi (phiên hết hạn, quá số lần) thì hiện lời nhắn của máy chủ và giữ nội dung', () => {
    authService.submitAccountAppeal.mockReturnValue(throwError(() => new HttpErrorResponse({
      status: 400, error: { message: 'Phiên gửi khiếu nại đã hết hạn. Hãy đăng nhập lại để gửi.' }
    })));
    const fixture = render(BLOCKED);
    fixture.componentInstance.message = 'Tôi bị khóa nhầm, xin xem xét lại giúp tôi.';
    fixture.componentInstance.sendAppeal();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('đã hết hạn');
    expect(fixture.componentInstance.message).toContain('khóa nhầm');
  });
});
