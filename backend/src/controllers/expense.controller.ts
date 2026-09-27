import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

import { createExpenseSchema, expenseQuerySchema, updateExpenseSchema } from "../validators/expense.validator";

import { createExpense, deleteExpense, getExpenseById, getExpenses, updateExpense } from "../services/expense.service";

export const create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const validationResult = createExpenseSchema.safeParse(req.body);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validationResult.error.flatten(),
			});

			return;
		}

		const expense = await createExpense(req.userId, validationResult.data);

		res.status(201).json({
			success: true,
			message: "Expense created successfully",
			data: {
				expense,
			},
		});
	} catch (error) {
		console.error("Create expense error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const list = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const validationResult = expenseQuerySchema.safeParse(req.query);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				message: "Invalid query parameters",
				errors: validationResult.error.flatten(),
			});

			return;
		}

		const expenses = await getExpenses(req.userId, validationResult.data);

		res.status(200).json({
			success: true,
			data: {
				expenses,
			},
		});
	} catch (error) {
		console.error("List expenses error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const getOne = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const expense = await getExpenseById(req.userId, req.params.id);

		res.status(200).json({
			success: true,
			data: {
				expense,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "EXPENSE_NOT_FOUND") {
			res.status(404).json({
				success: false,
				message: "Expense not found",
			});

			return;
		}

		console.error("Get expense error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const update = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const validationResult = updateExpenseSchema.safeParse(req.body);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validationResult.error.flatten(),
			});

			return;
		}

		const expense = await updateExpense(req.userId, req.params.id, validationResult.data);

		res.status(200).json({
			success: true,
			message: "Expense updated successfully",
			data: {
				expense,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "EXPENSE_NOT_FOUND") {
			res.status(404).json({
				success: false,
				message: "Expense not found",
			});

			return;
		}

		console.error("Update expense error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const remove = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		await deleteExpense(req.userId, req.params.id);

		res.status(200).json({
			success: true,
			message: "Expense deleted successfully",
		});
	} catch (error) {
		if (error instanceof Error && error.message === "EXPENSE_NOT_FOUND") {
			res.status(404).json({
				success: false,
				message: "Expense not found",
			});

			return;
		}

		console.error("Delete expense error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
