import { z } from 'zod';

export const SymbolSearchInputSchema = z.object({
  root_dir: z.string().default('.'),
  pattern: z.string().min(1),
  file_glob: z.string().optional(),
  context_before: z.number().int().min(0).default(2),
  context_after: z.number().int().min(0).default(2),
  max_results: z.number().int().min(1).max(1000).default(100),
});

export type SymbolSearchInput = z.infer<typeof SymbolSearchInputSchema>;

export const SymbolMatchSchema = z.object({
  file: z.string(),
  line: z.number().int().min(1),
  col: z.number().int().min(0),
  match_text: z.string(),
  context_before: z.array(z.string()).optional(),
  context_after: z.array(z.string()).optional(),
});

export type SymbolMatch = z.infer<typeof SymbolMatchSchema>;

export const SymbolSearchOutputSchema = z.array(SymbolMatchSchema);

export type SymbolSearchOutput = z.infer<typeof SymbolSearchOutputSchema>;
