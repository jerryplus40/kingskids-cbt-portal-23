import { z } from 'zod';

/** Matches the Supabase Auth policy in supabase/config.toml (8+ characters, letters and digits). */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-zA-Z]/, 'Include at least one letter')
  .regex(/\d/, 'Include at least one number');
