import { Injectable, inject } from '@angular/core';
import {
  Observable,
  exhaustMap,
  filter,
  forkJoin,
  map,
  of,
  retry,
  switchMap,
  take,
  timeout,
  timer
} from 'rxjs';
import {
  UserTaskResponse,
  VenueOwnerAccountRegistrationRequest,
  VenueOwnerApplicationSubmissionRequest,
  VenueOwnerDocumentKey,
  VenueOwnerRegistrationSession
} from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
import { VenueOwnerRegistrationRepository } from '@application/ports/venue-owner-registration.repository';
import { WorkflowApi } from '@infrastructure/api/workflow.api';

const DOCUMENTS: readonly { key: VenueOwnerDocumentKey; folder: string }[] = [
  { key: 'idCardFront', folder: 'identities' },
  { key: 'idCardBack', folder: 'identities' },
  { key: 'businessLicense', folder: 'licenses' },
  { key: 'venueImage', folder: 'venues' }
];

const VERIFY_EMAIL_TASK = 'Task_VerifyEmail';
const COLLECT_APPLICATION_TASK = 'Task_CollectOwnerApplication';
const USER_UPLOAD_TASK = 'Task_UserUpload';

@Injectable()
export class VenueOwnerRegistrationRepositoryImpl implements VenueOwnerRegistrationRepository {
  private readonly workflowApi = inject(WorkflowApi);

  startAccount(request: VenueOwnerAccountRegistrationRequest): Observable<VenueOwnerRegistrationSession> {
    return this.workflowApi.start({ ...request }).pipe(
      switchMap(response => this.waitForTask(
        response.data.processInstanceKey,
        response.data.registrationAccessToken,
        VERIFY_EMAIL_TASK,
        true
      ))
    );
  }

  continueAfterEmailVerification(
    session: VenueOwnerRegistrationSession
  ): Observable<VenueOwnerRegistrationSession> {
    return this.workflowApi.completeTask(
      session.taskKey,
      { emailVerified: true },
      session.registrationAccessToken
    ).pipe(
      retry({ count: 3, delay: 750 }),
      switchMap(() => this.waitForTask(
        session.processInstanceKey,
        session.registrationAccessToken,
        COLLECT_APPLICATION_TASK
      ))
    );
  }

  submitApplication(
    session: VenueOwnerRegistrationSession,
    request: VenueOwnerApplicationSubmissionRequest
  ): Observable<void> {
    const { files, ...application } = request;
    const uploadTasks = DOCUMENTS.map(document => ({
      file: files[document.key],
      folder: document.folder
    }));
    const presignedRequests = uploadTasks.map(task => ({
      fileName: task.file.name,
      contentType: task.file.type,
      folder: task.folder
    }));

    return this.workflowApi.completeTask(
      session.taskKey,
      { ...application, presignedRequests },
      session.registrationAccessToken
    ).pipe(
      retry({ count: 3, delay: 750 }),
      switchMap(() => timer(0, 1500).pipe(
        exhaustMap(() => this.workflowApi.getVariables(
          session.processInstanceKey,
          session.registrationAccessToken
        ).pipe(retry({ count: 4, delay: 500 }))),
        map(variableResponse => {
          const variables = variableResponse.data;
          if (variables.registrationError) {
            throw new Error(variables.registrationError);
          }
          return variables;
        }),
        filter(variables => Boolean(
          variables.ownerApplicationId && variables.presignedUrls?.length === uploadTasks.length
        )),
        take(1),
        timeout({ first: 45000 })
      )),
      switchMap(variables => {
        const uploads = uploadTasks.map((task, index) => {
          const presigned = variables.presignedUrls?.[index];
          if (!presigned) {
            throw new Error('WORKFLOW_PRESIGNED_URL_MISSING');
          }
          return this.workflowApi.uploadToPresignedUrl(presigned.uploadUrl, task.file).pipe(
            retry({ count: 2, delay: 750 }),
            map(() => presigned.objectKey)
          );
        });
        return forkJoin(uploads);
      }),
      switchMap(documentKeys => this.waitForTask(
        session.processInstanceKey,
        session.registrationAccessToken,
        USER_UPLOAD_TASK
      ).pipe(map(task => ({ task, documentKeys })))),
      switchMap(({ task, documentKeys }) => this.workflowApi.completeTask(
        task.taskKey,
        { documentKeys },
        session.registrationAccessToken
      ).pipe(retry({ count: 2, delay: 750 }))),
      map(() => void 0)
    );
  }

  private waitForTask(
    processInstanceKey: number,
    registrationAccessToken: string,
    expectedElementId: string,
    detectRegistrationError = false
  ): Observable<VenueOwnerRegistrationSession> {
    return timer(0, 1000).pipe(
      exhaustMap(() => this.workflowApi.getTask(processInstanceKey, registrationAccessToken).pipe(
        retry({ count: 4, delay: 500 }),
        switchMap(taskResponse => {
          if (taskResponse.data || !detectRegistrationError) return of(taskResponse);
          return this.workflowApi.getVariables(processInstanceKey, registrationAccessToken).pipe(
            map(variableResponse => {
              if (variableResponse.data.registrationError) {
                throw new Error(variableResponse.data.registrationError);
              }
              return taskResponse;
            })
          );
        })
      )),
      map(response => response.data),
      filter((task): task is UserTaskResponse => task?.elementId === expectedElementId),
      take(1),
      map(task => ({
        processInstanceKey,
        registrationAccessToken,
        taskKey: task.key
      })),
      timeout({ first: 45000 })
    );
  }
}
