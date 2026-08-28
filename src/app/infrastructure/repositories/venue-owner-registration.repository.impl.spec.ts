import { TestBed } from '@angular/core/testing';
import { firstValueFrom, of, Subject } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { VenueOwnerRegistrationRequest } from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
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
    workflowApi.getVariables.mockReturnValue(of({
      data: {
        ownerApplicationId: 'owner-application-id',
        presignedUrls: [0, 1, 2, 3].map(index => ({
          uploadUrl: `https://upload.example/${index}`,
          objectKey: `document-${index}`
        }))
      }
    }));
    workflowApi.uploadToPresignedUrl.mockReturnValue(of(void 0));
    workflowApi.getTask.mockReturnValue(of({
      data: { key: 123, elementId: 'Task_UserUpload' }
    }));
    workflowApi.completeTask.mockReturnValue(of({ data: void 0 }));

    TestBed.configureTestingModule({
      providers: [
        VenueOwnerRegistrationRepositoryImpl,
        { provide: WorkflowApi, useValue: workflowApi }
      ]
    });
    repository = TestBed.inject(VenueOwnerRegistrationRepositoryImpl);
  });

  it('start workflow, upload đủ tài liệu rồi complete đúng user task bằng registration token', async () => {
    await firstValueFrom(repository.register(createRequest()));

    expect(workflowApi.start).toHaveBeenCalledTimes(1);
    const variables = workflowApi.start.mock.calls[0][0] as Record<string, unknown>;
    expect(variables['username']).toBe('goat.owner');
    expect(variables['role']).toBeUndefined();
    expect(variables['files']).toBeUndefined();
    expect(variables['presignedRequests']).toEqual([
      { fileName: 'front.png', contentType: 'image/png', folder: 'identities' },
      { fileName: 'back.png', contentType: 'image/png', folder: 'identities' },
      { fileName: 'license.pdf', contentType: 'application/pdf', folder: 'licenses' },
      { fileName: 'venue.png', contentType: 'image/png', folder: 'venues' }
    ]);
    expect(workflowApi.getVariables).toHaveBeenCalledWith(991, 'registration-token');
    expect(workflowApi.uploadToPresignedUrl).toHaveBeenCalledTimes(4);
    expect(workflowApi.getTask).toHaveBeenCalledWith(991, 'registration-token');
    expect(workflowApi.getTask).toHaveBeenCalledTimes(1);
    expect(workflowApi.completeTask).toHaveBeenCalledWith(
      123,
      ['document-0', 'document-1', 'document-2', 'document-3'],
      'registration-token'
    );
  });

  it('không gửi chồng request variables khi request trước chưa hoàn tất', async () => {
    vi.useFakeTimers();
    const pendingVariables = new Subject<never>();
    workflowApi.getVariables.mockReturnValue(pendingVariables);
    const subscription = repository.register(createRequest()).subscribe();

    try {
      await vi.advanceTimersByTimeAsync(0);
      expect(workflowApi.getVariables).toHaveBeenCalledTimes(1);

      await vi.advanceTimersByTimeAsync(6000);
      expect(workflowApi.getVariables).toHaveBeenCalledTimes(1);
    } finally {
      subscription.unsubscribe();
      vi.useRealTimers();
    }
  });

  it('chỉ upload sau khi có cả owner application và bốn presigned URL', async () => {
    vi.useFakeTimers();
    workflowApi.getVariables
      .mockReturnValueOnce(of({ data: { ownerApplicationId: 'owner-application-id' } }))
      .mockReturnValueOnce(of({
        data: {
          ownerApplicationId: 'owner-application-id',
          presignedUrls: [0, 1, 2, 3].map(index => ({
            uploadUrl: `https://upload.example/${index}`,
            objectKey: `document-${index}`
          }))
        }
      }));

    try {
      const registration = firstValueFrom(repository.register(createRequest()));
      await vi.advanceTimersByTimeAsync(0);
      expect(workflowApi.uploadToPresignedUrl).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1500);
      await registration;
      expect(workflowApi.uploadToPresignedUrl).toHaveBeenCalledTimes(4);
      expect(workflowApi.completeTask).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

function createRequest(): VenueOwnerRegistrationRequest {
  return {
    username: 'goat.owner',
    fullName: 'Nguyễn Minh',
    email: 'owner@example.com',
    password: 'encrypted-password',
    confirmPassword: 'encrypted-password',
    phone: '0901234567',
    identityNumber: '012345678901',
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
