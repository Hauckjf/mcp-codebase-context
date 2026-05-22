import { z } from 'zod';

export const RecentChangesInputSchema = z.object({
  root_dir: z.string().default('.'),
  limit: z.number().int().min(1).max(200).default(20),
  since: z.string().optional(),
  path_filter: z.string().optional(),
});

export type RecentChangesInput = z.infer<typeof RecentChangesInputSchema>;

export const CommitSchema = z.object({
  hash: z.string().regex(/^[0-9a-f]{7,40}$/),
  author: z.string(),
  date_iso: z.string(),
  subject: z.string(),
  files_changed: z.array(z.string()),
});

export type Commit = z.infer<typeof CommitSchema>;

export const RecentChangesOutputSchema = z.array(CommitSchema);

export type RecentChangesOutput = z.infer<typeof RecentChangesOutputSchema>;
