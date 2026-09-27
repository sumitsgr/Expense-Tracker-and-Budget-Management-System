import { z } from "zod";

export const createBudgetSchema = z.object({
	category: z.string().min(1, "Category is required").max(50, "Category must not exceed 50 characters").trim(),

	amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Amount must be a valid monetary value"),

	month: z.number().int().min(1).max(12),

	year: z.number().int().min(2000).max(2100),
});

export const updateBudgetSchema = createBudgetSchema.partial();

export const budgetQuerySchema = z.object({
	month: z.coerce.number().int().min(1).max(12).optional(),

	year: z.coerce.number().int().min(2000).max(2100).optional(),

	category: z.string().max(50).optional(),
});

export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;

export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

export type BudgetQuery = z.infer<typeof budgetQuerySchema>;
