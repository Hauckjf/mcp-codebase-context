import { z } from 'zod';

export const FileTreeInputSchema = z.object({
  root_dir: z.string().default('.'),
  max_depth: z.number().int().min(1).default(10),
  include_ignored: z.boolean().default(false),
});

export type FileTreeInput = z.infer<typeof FileTreeInputSchema>;

export const FileNodeSchema = z.object({
  path: z.string(),
  type: z.enum(['file', 'directory']),
  size: z.number().int().min(0).optional(),
  ignored: z.boolean(),
});

export type FileNode = z.infer<typeof FileNodeSchema>;

export const FileTreeOutputSchema = z.array(FileNodeSchema);

export type FileTreeOutput = z.infer<typeof FileTreeOutputSchema>;
