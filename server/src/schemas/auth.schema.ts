import { z } from 'zod';

export const registerSchema = z
  .object({
    username: z.string().min(3).max(30),
    email: z.string().email(),
    password: z.string().min(8).max(72),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
  })
  .strict();

export const loginSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(1),
  })
  .strict();

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
