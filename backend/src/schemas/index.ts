import { z } from 'zod';

export const createPromptSchema = z.object({
  task: z.enum(['task1', 'task2']),
  type: z.string().min(1, "Type is required"),
  text: z.string().min(1, "Text is required"),
  sample: z.string().optional(),
  // image path will be handled by multer, so it won't be strictly validated in JSON body
});

export const updatePromptSchema = createPromptSchema.partial();

export const createEssaySchema = z.object({
  task: z.enum(['task1', 'task2']),
  promptId: z.string().uuid(),
  studentName: z.string().min(1, "Student name is required"),
  content: z.string(),
  wordCount: z.number().int().nonnegative(),
  status: z.enum(['draft', 'submitted', 'grading', 'graded']).optional(),
});

export const updateEssaySchema = z.object({
  content: z.string().optional(),
  wordCount: z.number().int().nonnegative().optional(),
  status: z.enum(['draft', 'submitted', 'grading', 'graded']).optional(),
  timerEndsAt: z.string().optional().nullable(),
  timerExpiredAt: z.string().optional().nullable(),
});

export const annotationSchema = z.object({
  start: z.number().int().nonnegative(),
  end: z.number().int().nonnegative(),
  quote: z.string(),
  feedback: z.string(),
  createdAt: z.string(),
});

export const gradeEssaySchema = z.object({
  ta: z.number().min(0).max(9).optional(),
  cc: z.number().min(0).max(9).optional(),
  lr: z.number().min(0).max(9).optional(),
  gra: z.number().min(0).max(9).optional(),
  overall: z.number().min(0).max(9).optional(),
  feedback: z.string().optional(),
  annotations: z.array(annotationSchema).optional(),
  status: z.enum(['grading', 'graded']).optional(),
});
