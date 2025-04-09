export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  REPAID = 'REPAID',
  CANCELLED = 'CANCELLED'
}

export interface CashAdvanceApplication {
  id: string;
  userId: string;
  amount: number;
  status: ApplicationStatus;
  createdAt: string;
  updatedAt: string;
  disbursementDate?: string;
  repaymentDate?: string;
  repaymentAmount?: number;
  remainingAmount?: number;
  creditLimit: number;
  expressDelivery?: boolean;
  tip?: number;
}

export interface ApplicationFormData {
  amount: number | string;
  expressDelivery: boolean;
  tip: number | string;
  purpose: string;
}

export interface DisbursementFormData {
  applicationId: string;
  expressDelivery: boolean;
  tip: number;
}

export interface RepaymentFormData {
  applicationId: string;
  amount: number;
} 