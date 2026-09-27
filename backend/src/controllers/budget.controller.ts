import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

import { createBudget, deleteBudget, getBudgetById, getBudgets, updateBudget } from "../services/budget.service";

import { createBudgetSchema, budgetQuerySchema, updateBudgetSchema } from "../validators/budget.validator";

export const create = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const validation = createBudgetSchema.safeParse(req.body);

		if (!validation.success) {
			res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validation.error.flatten(),
			});

			return;
		}

		const budget = await createBudget(req.userId, validation.data);

		res.status(201).json({
			success: true,
			message: "Budget created successfully",
			data: {
				budget,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "BUDGET_ALREADY_EXISTS") {
			res.status(409).json({
				success: false,
				message: "A budget for this category and month already exists",
			});

			return;
		}

		console.error("Create budget error:", error);

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

		const validation = budgetQuerySchema.safeParse(req.query);

		if (!validation.success) {
			res.status(400).json({
				success: false,
				message: "Invalid filters",
				errors: validation.error.flatten(),
			});

			return;
		}

		const budgets = await getBudgets(req.userId, validation.data);

		res.status(200).json({
			success: true,
			data: {
				budgets,
			},
		});
	} catch (error) {
		console.error("List budgets error:", error);

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

		const budget = await getBudgetById(req.userId, req.params.id);

		if (!budget) {
			res.status(404).json({
				success: false,
				message: "Budget not found",
			});

			return;
		}

		res.status(200).json({
			success: true,
			data: {
				budget,
			},
		});
	} catch (error) {
		console.error("Get budget error:", error);

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

		const validation = updateBudgetSchema.safeParse(req.body);

		if (!validation.success) {
			res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validation.error.flatten(),
			});

			return;
		}

		const budget = await updateBudget(req.userId, req.params.id, validation.data);

		if (!budget) {
			res.status(404).json({
				success: false,
				message: "Budget not found",
			});

			return;
		}

		res.status(200).json({
			success: true,
			message: "Budget updated successfully",
			data: {
				budget,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "NO_FIELDS_TO_UPDATE") {
			res.status(400).json({
				success: false,
				message: "No fields provided for update",
			});

			return;
		}

		if (error instanceof Error && error.message === "BUDGET_ALREADY_EXISTS") {
			res.status(409).json({
				success: false,
				message: "A budget for this category and month already exists",
			});

			return;
		}

		console.error("Update budget error:", error);

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

		const deleted = await deleteBudget(req.userId, req.params.id);

		if (!deleted) {
			res.status(404).json({
				success: false,
				message: "Budget not found",
			});

			return;
		}

		res.status(200).json({
			success: true,
			message: "Budget deleted successfully",
		});
	} catch (error) {
		console.error("Delete budget error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
