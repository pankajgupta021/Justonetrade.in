import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').transform(val => val.toLowerCase().trim()),
  countryCode: z.string().min(1, 'Country code is required').regex(/^\+\d{1,4}$/, 'Must be a valid country code (e.g., +91)'),
  contactNumber: z.string()
    .min(5, 'Contact number is too short')
    .max(15, 'Contact number is too long')
    .regex(/^[\s.-]?\d+([\s.-]?\d+)*$/, 'Must be a valid number')
    .transform(val => val.trim()),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  acceptTerms: z.literal(true, {
    message: 'You must accept the Terms & Conditions',
  }),
  acceptPrivacy: z.literal(true, {
    message: 'You must accept the Privacy Policy',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').transform(val => val.toLowerCase().trim()),
  password: z.string().min(1, 'Password is required'),
});
