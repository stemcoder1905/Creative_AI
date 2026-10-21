// src/types/index.ts
/**
 * Shared TypeScript types for the CreativeAI Studio backend.
 */
export interface Profile {
  id: string;
  auth_user_id: string;
  full_name?: string | null;
  phone?: string | null;
  business_name?: string | null;
  profession?: string | null;
  business_description?: string | null;
  target_audience?: string | null;
  preferred_language?: string | null;
  country?: string | null;
  website?: string | null;
  social_links?: Record<string, string> | null;
  brandColors?: string[]; // optional array of hex colors
  // Extend with more branding fields as needed
}

export interface DesignBrief {
  profession: string;
  businessName: string;
  topic: string;
  designType: string;
  platform: string;
  style: string;
  language?: string;
  colorPalette?: string;
  logoUrl?: string;
}
