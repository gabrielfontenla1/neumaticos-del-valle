/**
 * Branch (Store) Type Definitions
 * Represents a physical store location with contact info and hours
 */

export interface OpeningHours {
  weekdays: string;
  saturday: string;
  sunday?: string;
}

export interface Branch {
  id: string;
  name: string;
  address: string;
  city: string;
  province: string | null;
  phone: string;
  whatsapp: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours: OpeningHours;
  background_image_url?: string | null;
  is_main: boolean;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateBranchInput {
  name: string;
  address: string;
  city: string;
  province?: string | null;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  opening_hours?: OpeningHours;
  background_image_url?: string | null;
  is_main?: boolean;
  active?: boolean;
}

export interface UpdateBranchInput extends Partial<CreateBranchInput> {
  id: string;
}
