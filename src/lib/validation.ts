import { z } from 'zod';

/**
 * Matches the Supabase Auth policy in supabase/config.toml: 8+ characters with a lowercase
 * letter, an uppercase letter and a digit ("letters_digits").
 */
export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters')
  .regex(/[a-z]/, 'Include a lowercase letter')
  .regex(/[A-Z]/, 'Include a capital letter')
  .regex(/\d/, 'Include a number');

export const PASSWORD_HINT = 'At least 8 characters, with a capital letter, a lowercase letter and a number.';
