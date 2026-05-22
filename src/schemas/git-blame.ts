import { z } from 'zod';

export const GitBlameInputSchema = z.object({
  root_dir: z.string().default('.'),
  file_path: z.string().min(1),
  line_start: z.number().int().min(1).optional(),
  line_end: z.number().int().min(1).optional(),
});

export type GitBlameInput = z.infer<typeof GitBlameInputSchema>;

export const BlameHunkSchema = z.object({
  commit_hash: z.string().regex(/^[0-9a-f]{7,40}$/),
  author: z.string(),
  timestamp_unix: z.number().int(),
  line_start: z.number().int().min(1),
  line_end: z.number().int().min(1),
  content: z.string(),
});

export type BlameHunk = z.infer<typeof BlameHunkSchema>;

export const GitBlameOutputSchema = z.array(BlameHunkSchema);

export type GitBlameOutput = z.infer<typeof GitBlameOutputSchema>;
