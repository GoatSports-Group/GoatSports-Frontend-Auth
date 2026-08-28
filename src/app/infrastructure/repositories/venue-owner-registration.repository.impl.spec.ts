import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  VenueOwnerAccountRegistrationRequest,
  VenueOwnerApplicationSubmissionRequest,
  VenueOwnerRegistrationSession
} from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
import { WorkflowApi } from '@infrastructure/api/workflow.api';
import { VenueOwnerRegistrationRepositoryImpl } from './venue-owner-registration.repository.impl';

describe('VenueOwnerRegistrationRepositoryImpl', () => {
  const workflowApi = {
    start: vi.fn(),
    getVariables: vi.fn(),
    uploadToPresignedUrl: vi.fn(),
    getTask: vi.fn(),
    completeTask: vi.fn()
  };

  let repository: VenueOwnerRegistrationRepositoryImpl;

  beforeEach(() => {
    Object.values(workflowApi).forEach(mock => mock.mockReset());
    workflowApi.start.mockReturnValue(of({
      data: { processInstanceKey: 991, registrationAccessToken: 'registration-token' }
    }));
    workflowApi.completeTask.mockReturnValue(of({ data: void 0 }));
    workflowApi.uploadToPresignedUrl.mockReturnValue(of(void 0));

    TestBed.configureTestingModule({
      providers: [
        VenueOwnerRegistrationRepositoryImpl,
        { provide: WorkflowApi, useValue: workflowApi }
      ]
    });
    repository = TestBed.inject(VenueOwnerRegistrationRepositoryImpl);
  });

  it('khởi động workflow bằng dữ liệu tài khoản rồi dừng tại task xác thực email', async () => {
    workflowApi.getTask.mockReturnValue(of({ data: { key: 11, elementId: 'Task_VerifyEmail' } }));

    const session = await firstValueFrom(repository.startAccount(createAccountRequest()));

    expect(workflowApi.start).toHaveBeenCalledWith(createAccountRequest());
    expect(session).toEqual({
      processInstanceKey: 991,
      registrationAccessToken: 'registration-token',
      taskKey: 11
    });
    expect(workflowApi.getVariables).not.toHaveBeenCalled();
  });

  it('chỉ mở task khai báo cơ sở sau khi frontend xác thực email', async () => {
    workflowApi.getTask.mockReturnValue(of({ data: { key: 22, elementId: 'Task_CollectOwnerApplication' } }));

    const session = await firstValueFrom(repository.continueAfterEmailVerification(createSession(11)));

    expect(workflowApi.completeTask).toHaveBeenCalledWith(11, { emailVerified: true }, 'registration-token');
    expect(session.taskKey).toBe(22);
  });

  it('complete thông tin cơ sở, upload đủ tài liệu rồi complete user-upload task', async () => {
    workflowApi.getVariables.mockReturnValue(of({
      data: {
        ownerApplicationId: 'owner-application-id',
        presignedUrls: [0, 1, 2, 3].map(index => ({
          uploadUrl: `https://upload.example/${index}`,
          objectKey: `document-${index}`
        }))
      }
    }));
    workflowApi.getTask.mockReturnValue(of({ data: { key: 33, elementId: 'Task_UserUpload' } }));

    await firstValueFrom(repository.submitApplication(createSession(22), createApplicationRequest()));

    const firstCompletion = workflowApi.completeTask.mock.calls[0];
    expect(firstCompletion[0]).toBe(22);
    expect(firstCompletion[1]).toMatchObject({
      businessName: 'GOAT Arena',
      address: '12 Nguyễn Văn Bảo',
      presignedRequests: expect.any(Array)
    });
    expect(workflowApi.uploadToPresignedUrl).toHaveBeenCalledTimes(4);
    expect(workflowApi.completeTask).toHaveBeenLastCalledWith(
      33,
      { documentKeys: ['document-0', 'document-1', 'document-2', 'document-3'] },
      'registration-token'
    );
  });

  it('không poll chồng request khi lần lấy task trước chưa hoàn tất', async () => {
    vi.useFakeTimers();
    const pendingTask = new Subject<never>();
    workflowApi.getTask.mockReturnValue(pendingTask);
    const subscription = repository.startAccount(createAccountRequest()).subscribe();

    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(workflowApi.getTask).toHaveBeenCalledTimes(1);
      await vi.advanceTimersByTimeAsync(5000);
      expect(workflowApi.getTask).toHaveBeenCalledTimes(1);
    } finally {
      subscription.unsubscribe();
      vi.useRealTimers();
    }
  });
});

function createSession(taskKey: number): VenueOwnerRegistrationSession {
  return { processInstanceKey: 991, registrationAccessToken: 'registration-token', taskKey };
}

function createAccountRequest(): VenueOwnerAccountRegistrationRequest {
  return {
    username: 'goat.owner',
    fullName: 'Nguyễn Minh',
    email: 'owner@example.com',
    password: 'encrypted-password',
    confirmPassword: 'encrypted-password',
    phone: '0901234567',
    identityNumber: '012345678901'
  };
}

function createApplicationRequest(): VenueOwnerApplicationSubmissionRequest {
  return {
    businessName: 'GOAT Arena',
    businessType: 'COMPANY',
    taxCode: '0123456789',
    address: '12 Nguyễn Văn Bảo',
    province: 'TP. Hồ Chí Minh',
    district: 'Gò Vấp',
    ward: 'Phường 4',
    city: 'TP. Hồ Chí Minh',
    files: {
      idCardFront: new File(['front'], 'front.png', { type: 'image/png' }),
      idCardBack: new File(['back'], 'back.png', { type: 'image/png' }),
      businessLicense: new File(['license'], 'license.pdf', { type: 'application/pdf' }),
      venueImage: new File(['venue'], 'venue.png', { type: 'image/png' })
    }
  };
}
