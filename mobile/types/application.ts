export enum ApplicationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  DISBURSED = 'DISBURSED',
  REPAID = 'REPAID',
  CANCELLED = 'CANCELLED'
}

// Expanded interface for details view
export interface CashAdvanceApplication {
  id: string;
  // userId: string; // Assuming not directly needed in dashboard UI
  amount: number;
  status: ApplicationStatus;
  createdAt: string; // Or Date object if preferred
  updatedAt?: string; // Added
  disbursementDate?: string; // Added
  repaymentDate?: string; // Added
  repaymentAmount?: number; // Added
  remainingAmount?: number; // Added
  creditLimit?: number; // Added (Make optional or ensure it's always fetched)
  // Add other fields from web version if needed (expressDelivery, tip, purpose)
  expressDelivery?: boolean;
  tip?: number;
  purpose?: string; // Added purpose
  // Add other fields as needed for UI
}

// Interface for User object from AuthContext (if needed)
export interface User {
    id: string;
    email: string;
    firstName?: string; // Make optional if not always available
    lastName?: string;
}

// Form data interfaces (mirroring web app)
export interface DisbursementFormData {
  applicationId: string;
  expressDelivery: boolean;
  tip: number;
}

export interface RepaymentFormData {
  applicationId: string;
  amount: number;
}

// Added ApplicationFormData
export interface ApplicationFormData {
    amount: number; // Use number, handle string conversion in component
    purpose: string;
    expressDelivery: boolean;
    tip: number;
} 