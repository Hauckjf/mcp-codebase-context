import { z } from 'zod';

export const DependencyGraphInputSchema = z.object({
  root_dir: z.string().default('.'),
  include_dev: z.boolean().default(true),
  include_peer: z.boolean().default(false),
});

export type DependencyGraphInput = z.infer<typeof DependencyGraphInputSchema>;

export const DependencyNodeSchema = z.object({
  name: z.string().min(1),
  version: z.string(),
  dep_type: z.enum(['prod', 'dev', 'peer']),
  source_file: z.string(),
});

export type DependencyNode = z.infer<typeof DependencyNodeSchema>;

export const DependencyGraphOutputSchema = z.array(DependencyNodeSchema);

export type DependencyGraphOutput = z.infer<typeof DependencyGraphOutputSchema>;
