import { z } from 'zod';

export const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address').transform(val => val.toLowerCase().trim()),
  phone: z.string()
    .min(10, 'Phone number is too short')
    .max(20, 'Phone number is too long')
    .regex(/^\+1[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{4}$/, 'Must be a valid US phone number starting with +1')
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
