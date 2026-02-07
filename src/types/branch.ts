/**
 * Branch (Store) Type Definitions
 * Represents a physical store location with contact info and hours
 */

// Time slot for a single shift
export interface TimeSlot {
  from: string; // HH:MM format
  to: string;   // HH:MM format
}

// Day schedule with optional morning and afternoon shifts
export interface DaySchedule {
  closed: boolean;
  morning?: TimeSlot;
  afternoon?: TimeSlot;
}

// Structured schedule for the week
export interface StructuredSchedule {
  weekdays: DaySchedule;
  saturday: DaySchedule;
  sunday: DaySchedule;
}

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
