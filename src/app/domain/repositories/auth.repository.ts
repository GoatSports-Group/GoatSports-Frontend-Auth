import { Observable } from 'rxjs';
import { BaseResponse } from '../entities/base';
import { User, LoginRequest, RegisterRequest, VerificationRequest, ForgotPasswordRequest } from '../entities/user';

export interface AuthRepository {
  login(payload: LoginRequest): Observable<BaseResponse<User>>;
  loginWithKeycloak(payload: { code: string; redirectUri: string }): Observable<BaseResponse<User>>;
  register(payload: RegisterRequest): Observable<BaseResponse<User>>;
  verify(payload: VerificationRequest): Observable<BaseResponse<void>>;
  forgotPassword(payload: ForgotPasswordRequest): Observable<any>;
  resendVerificationCode(email: string): Observable<any>;
  logout(): Observable<BaseResponse<void>>;
  refresh(): Observable<BaseResponse<User>>;
  getCurrentUser(): Observable<BaseResponse<User>>;
}
