export type VenueOwnerDocumentKey = 'idCardFront' | 'idCardBack' | 'businessLicense' | 'venueImage';

export type VenueOwnerRegistrationFiles = Record<VenueOwnerDocumentKey, File>;

export interface VenueOwnerRegistrationRequest {
  username: string;
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  phone: string;
  identityNumber: string;
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
