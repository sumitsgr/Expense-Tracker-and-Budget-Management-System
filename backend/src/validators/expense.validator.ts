import { z } from "zod";

export const createExpenseSchema = z.object({
	category: z.string().min(1, "Category is required").max(50, "Category must not exceed 50 characters").trim(),

	amount: z.number().positive("Amount must be greater than zero"),

	description: z.string().max(255, "Description must not exceed 255 characters").trim().optional(),

	expense_date: z.string().date("Invalid expense date"),
});

export const updateExpenseSchema = createExpenseSchema;

export const expenseQuerySchema = z.object({
	category: z.string().max(50).optional(),

	from: z.string().date().optional(),

	to: z.string().date().optional(),
});

export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;

export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
