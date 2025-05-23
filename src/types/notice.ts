import { Dayjs } from 'dayjs';

export interface ImageUploaderDetails {
  file: File | null;
  previewUrl: string | null;
  dimensions: { width: number; height: number } | null;
  fileSize: string | null;
}

export interface NoticeFormState {
  imageDetails: ImageUploaderDetails;
  startDate: Dayjs | null;
  endDate: Dayjs | null;
}

export interface NoticeDetail {
  id: string;
  userId: string;
  type: string;
  auditInfo: {
    createdBy: string;
    createdAt: string;
    updatedBy: string;
    updatedAt: string;
    deletedAt: string | null;
  };
  tenantId: string;
  tenantIds: string | null;
  content: string;
  started: number;
  expired: number;
}

export interface NoticeListResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  data: NoticeDetail[];
}

export interface NoticeMutationResponse {
  timestamp: string;
  status: number;
  code: string;
  message: string;
  data: NoticeDetail;
}
