import { Injectable, inject } from '@angular/core';
import { Observable, exhaustMap, filter, forkJoin, map, retry, switchMap, take, timeout, timer } from 'rxjs';
import {
  VenueOwnerDocumentKey,
  VenueOwnerRegistrationRequest
} from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
import { VenueOwnerRegistrationRepository } from '@application/ports/venue-owner-registration.repository';
import { WorkflowApi } from '@infrastructure/api/workflow.api';

const DOCUMENTS: readonly { key: VenueOwnerDocumentKey; folder: string }[] = [
  { key: 'idCardFront', folder: 'identities' },
  { key: 'idCardBack', folder: 'identities' },
  { key: 'businessLicense', folder: 'licenses' },
  { key: 'venueImage', folder: 'venues' }
];

@Injectable()
export class VenueOwnerRegistrationRepositoryImpl implements VenueOwnerRegistrationRepository {
  private readonly workflowApi = inject(WorkflowApi);

  register(request: VenueOwnerRegistrationRequest): Observable<void> {
    const { files, ...form } = request;
    const uploadTasks = DOCUMENTS.map(document => ({
      file: files[document.key],
      folder: document.folder
    }));

    const presignedRequests = uploadTasks.map(task => ({
      fileName: task.file.name,
      contentType: task.file.type,
      folder: task.folder
    }));

    return this.workflowApi.start({ ...form, presignedRequests }).pipe(
      switchMap(response => {
        const instanceKey = response.data.processInstanceKey;
        const registrationToken = response.data.registrationAccessToken;
        return timer(0, 1500).pipe(
          exhaustMap(() => this.workflowApi.getVariables(instanceKey, registrationToken).pipe(
            retry({ count: 4, delay: 500 })
          )),
          map(variableResponse => {
            const variables = variableResponse.data;
            if (variables.registrationError) {
              throw new Error(variables.registrationError);
            }
            return { instanceKey, registrationToken, variables };
          }),
          filter(({ variables }) => Boolean(
            variables.ownerApplicationId && variables.presignedUrls?.length === uploadTasks.length
          )),
          take(1),
          map(({ instanceKey: key, registrationToken: token, variables }) => ({
            instanceKey: key,
            registrationToken: token,
            ownerApplicationId: variables.ownerApplicationId!,
            presignedUrls: variables.presignedUrls!
          })),
          timeout({ first: 45000 })
        );
      }),
      switchMap(({ instanceKey, registrationToken, ownerApplicationId, presignedUrls }) => {
        const uploads = uploadTasks.map((task, index) => {
          const presigned = presignedUrls[index];
          if (!presigned) {
            throw new Error('WORKFLOW_PRESIGNED_URL_MISSING');
          }
          return this.workflowApi.uploadToPresignedUrl(presigned.uploadUrl, task.file).pipe(
            retry({ count: 2, delay: 750 }),
            map(() => presigned.objectKey)
          );
        });
        return forkJoin(uploads).pipe(map(documentKeys => ({
          instanceKey,
          registrationToken,
          ownerApplicationId,
          documentKeys
        })));
      }),
      switchMap(({ instanceKey, registrationToken, documentKeys }) =>
        this.workflowApi.getTask(instanceKey, registrationToken).pipe(
          map(response => {
            const task = response.data;
            if (!task || task.elementId !== 'Task_UserUpload') {
              throw new Error('WORKFLOW_USER_UPLOAD_TASK_NOT_FOUND');
            }
            return task;
          }),
          switchMap(task => this.workflowApi.completeTask(task.key, documentKeys, registrationToken).pipe(
            retry({ count: 2, delay: 750 })
          ))
        )
      ),
      map(() => void 0)
    );
  }
}
