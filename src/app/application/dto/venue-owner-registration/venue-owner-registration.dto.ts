export type VenueOwnerDocumentKey = 'idCardFront' | 'idCardBack' | 'businessLicense' | 'venueImage';

export type VenueOwnerRegistrationFiles = Record<VenueOwnerDocumentKey, File>;

export interface VenueOwnerAccountRegistrationRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  identityNumber: string;
}

export interface VenueOwnerApplicationSubmissionRequest {
  businessName: string;
  businessType: string;
  taxCode: string;
  address: string;
  province: string;
  district: string;
  ward: string;
  city: string;
  files: VenueOwnerRegistrationFiles;
}

export interface VenueOwnerRegistrationSession {
  processInstanceKey: number;
  registrationAccessToken: string;
  taskKey: number;
}

export interface ProcessInstanceResponse {
  processInstanceKey: number;
  registrationAccessToken: string;
}

export interface PresignedUrlResponse {
  uploadUrl: string;
  objectKey: string;
}

export interface ProcessVariablesResponse {
  ownerApplicationId?: string;
  presignedUrls?: PresignedUrlResponse[];
  registrationError?: string;
}

export interface UserTaskResponse {
  key: number;
  elementId: string;
}
