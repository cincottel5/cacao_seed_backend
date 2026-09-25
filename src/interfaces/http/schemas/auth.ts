import { z } from 'zod';

export const googleAuthRequestSchema = z.object({ body: z.object({ idToken: z.string().min(1) }) });