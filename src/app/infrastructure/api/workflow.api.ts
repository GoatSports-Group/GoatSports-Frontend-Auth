import { HttpBackend, HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseResponse } from '@application/dto/base/base-response';
import {
  ProcessInstanceResponse,
  ProcessVariablesResponse,
  UserTaskResponse
} from '@application/dto/venue-owner-registration/venue-owner-registration.dto';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class WorkflowApi {
  private readonly http = inject(HttpClient);
  private readonly httpBackend = inject(HttpBackend);
  private readonly bypassHttp = new HttpClient(this.httpBackend);
  private readonly baseUrl = `${environment.apiUrl}/workflow-service/api/v1/workflows/public`;

  start(variables: Record<string, unknown>): Observable<BaseResponse<ProcessInstanceResponse>> {
    return this.http.post<BaseResponse<ProcessInstanceResponse>>(`${this.baseUrl}/start`, { variables });
  }

  getVariables(instanceKey: number, registrationToken: string): Observable<BaseResponse<ProcessVariablesResponse>> {
    return this.http.get<BaseResponse<ProcessVariablesResponse>>(
      `${this.baseUrl}/instances/${instanceKey}/variables`,
      { headers: { 'X-Registration-Token': registrationToken } }
    );
  }

  getTask(instanceKey: number, registrationToken: string): Observable<BaseResponse<UserTaskResponse | null>> {
    return this.http.get<BaseResponse<UserTaskResponse | null>>(
      `${this.baseUrl}/instances/${instanceKey}/tasks`,
      { headers: { 'X-Registration-Token': registrationToken } }
    );
  }

  uploadToPresignedUrl(uploadUrl: string, file: File): Observable<void> {
    return this.bypassHttp.put<void>(uploadUrl, file, {
      headers: { 'Content-Type': file.type }
    });
  }

  completeTask(
    taskKey: number,
    variables: Record<string, unknown>,
    registrationToken: string
  ): Observable<BaseResponse<void>> {
    return this.http.post<BaseResponse<void>>(`${this.baseUrl}/tasks/${taskKey}/complete`, {
      variables
    }, { headers: { 'X-Registration-Token': registrationToken } });
  }
}
