import { randomUUID } from "crypto";

import pool from "../config/database";
import { Budget } from "../types/budget";

import { CreateBudgetInput, BudgetQuery, UpdateBudgetInput } from "../validators/budget.validator";

export const createBudget = async (userId: string, input: CreateBudgetInput): Promise<Budget> => {
	const id = randomUUID();

	const { category, amount, month, year } = input;

	try {
		await pool.execute(
			`
      INSERT INTO budgets (
        id,
        user_id,
        category,
        amount,
        month,
        year
      )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
			[id, userId, category, amount, month, year],
		);
	} catch (error) {
		const dbError = error as {
			code?: string;
		};

		if (dbError.code === "ER_DUP_ENTRY") {
			throw new Error("BUDGET_ALREADY_EXISTS");
		}

		throw error;
	}

	const [rows] = await pool.execute(
		`
    SELECT
      id,
      user_id,
      category,
      amount,
      month,
      year,
      created_at,
      updated_at
    FROM budgets
    WHERE id = ?
      AND user_id = ?
    LIMIT 1
    `,
		[id, userId],
	);

	const budgets = rows as Budget[];

	if (budgets.length === 0) {
		throw new Error("BUDGET_CREATION_FAILED");
	}

	return budgets[0];
};

export const getBudgets = async (userId: string, filters: BudgetQuery): Promise<Budget[]> => {
	let sql = `
    SELECT
      id,
      user_id,
      category,
      amount,
      month,
      year,
      created_at,
      updated_at
    FROM budgets
    WHERE user_id = ?
  `;

	const params: (string | number)[] = [userId];

	if (filters.month !== undefined) {
		sql += " AND month = ?";
		params.push(filters.month);
	}

	if (filters.year !== undefined) {
		sql += " AND year = ?";
		params.push(filters.year);
	}

	if (filters.category) {
		sql += " AND category = ?";
		params.push(filters.category);
	}

	sql += " ORDER BY year DESC, month DESC, category ASC";

	const [rows] = await pool.execute(sql, params);

	return rows as Budget[];
};

export const getBudgetById = async (userId: string, budgetId: string): Promise<Budget | null> => {
	const [rows] = await pool.execute(
		`
    SELECT
      id,
      user_id,
      category,
      amount,
      month,
      year,
      created_at,
      updated_at
    FROM budgets
    WHERE id = ?
      AND user_id = ?
    LIMIT 1
    `,
		[budgetId, userId],
	);

	const budgets = rows as Budget[];

	return budgets[0] ?? null;
};

export const updateBudget = async (
	userId: string,
	budgetId: string,
	input: UpdateBudgetInput,
): Promise<Budget | null> => {
	const fields: string[] = [];
	const params: (string | number)[] = [];

	if (input.category !== undefined) {
		fields.push("category = ?");
		params.push(input.category);
	}

	if (input.amount !== undefined) {
		fields.push("amount = ?");
		params.push(input.amount);
	}

	if (input.month !== undefined) {
		fields.push("month = ?");
		params.push(input.month);
	}

	if (input.year !== undefined) {
		fields.push("year = ?");
		params.push(input.year);
	}

	if (fields.length === 0) {
		throw new Error("NO_FIELDS_TO_UPDATE");
	}

	fields.push("updated_at = CURRENT_TIMESTAMP");

	params.push(budgetId);
	params.push(userId);

	try {
		await pool.execute(
			`
      UPDATE budgets
      SET ${fields.join(", ")}
      WHERE id = ?
        AND user_id = ?
      `,
			params,
		);
	} catch (error) {
		const dbError = error as {
			code?: string;
		};

		if (dbError.code === "ER_DUP_ENTRY") {
			throw new Error("BUDGET_ALREADY_EXISTS");
		}

		throw error;
	}

	return getBudgetById(userId, budgetId);
};

export const deleteBudget = async (userId: string, budgetId: string): Promise<boolean> => {
	const [result] = await pool.execute(
		`
    DELETE FROM budgets
    WHERE id = ?
      AND user_id = ?
    `,
		[budgetId, userId],
	);

	const deleteResult = result as {
		affectedRows: number;
	};

	return deleteResult.affectedRows > 0;
};
