import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { PasswordStrengthComponent } from './password-strength.component';

describe('PasswordStrengthComponent', () => {
  it('tính và hiển thị độ mạnh mật khẩu', () => {
    const fixture = TestBed.createComponent(PasswordStrengthComponent);
    fixture.componentRef.setInput('password', 'Strong@123');
    fixture.detectChanges();

    expect(fixture.componentInstance.score()).toBe(4);
    expect(fixture.nativeElement.textContent).toContain('4/4');
    expect(fixture.nativeElement.querySelectorAll('.bg-emerald-500')).toHaveLength(4);
  });

  it('hiển thị danh sách lỗi với id và màu danger được truyền vào', () => {
    const fixture = TestBed.createComponent(PasswordStrengthComponent);
    fixture.componentRef.setInput('errors', ['Mật khẩu chưa hợp lệ.', 'Mật khẩu xác nhận không khớp.']);
    fixture.componentRef.setInput('errorId', 'password-errors');
    fixture.detectChanges();

    const error = fixture.nativeElement.querySelector('#password-errors') as HTMLElement;
    expect(error.getAttribute('role')).toBe('alert');
    expect(error.classList.contains('text-rose-600')).toBe(true);
    expect(error.querySelectorAll('p')).toHaveLength(2);
  });
});
