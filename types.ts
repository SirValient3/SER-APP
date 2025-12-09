export enum LineItemCategory {
  PRE_PRODUCTION = 'Pre-Production',
  PRODUCTION = 'Production',
  POST_PRODUCTION = 'Post-Production',
  EQUIPMENT = 'Equipment & Rentals',
  EXPENSES = 'Expenses',
  OTHER = 'Other'
}

export interface LineItem {
  id: string;
  description: string;
  category: LineItemCategory;
  quantity: number;
  rate: number;
  unit: 'day' | 'hour' | 'flat' | 'item';
  taxable: boolean;
}

export interface ProjectDetails {
  clientName: string;
  projectName: string;
  projectDate: string;
  location: string;
  email: string;
  phone: string;
  notes: string;
  paymentLink?: string;
  // Branding Fields
  businessName?: string;
  businessLogo?: string;
  payableTo?: string;
  // Contact Fields
  businessAddress?: string;
  businessEmail?: string;
  businessPhone?: string;
}

export interface Estimate {
  id: string;
  details: ProjectDetails;
  items: LineItem[];
  markupPercent: number;
  taxPercent: number;
  currency: string;
  createdAt: number;
}

export interface UserProfile {
  businessName: string;
  businessLogo: string;
  payableTo: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
  paymentLink: string;
}

export interface RateEstimate {
  role: string;
  low: number;
  average: number;
  high: number;
  unit: string;
  currency: string;
  source?: string;
}

export interface GroundingSource {
    uri: string;
    title: string;
}