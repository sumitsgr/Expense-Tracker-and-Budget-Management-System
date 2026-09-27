import pool from "../config/database";
import { Expense } from "../types/expense";
import { CreateExpenseInput, ExpenseQueryInput, UpdateExpenseInput } from "../validators/expense.validator";

export const createExpense = async (userId: string, input: CreateExpenseInput): Promise<Expense> => {
	const { category, amount, description, expense_date } = input;

	await pool.execute(
		`
    INSERT INTO expenses (
      user_id,
      category,
      amount,
      description,
      expense_date
    )
    VALUES (?, ?, ?, ?, ?)
    `,
		[userId, category, amount, description ?? null, expense_date],
	);

	const [rows] = await pool.execute(
		`
    SELECT
      id,
      user_id,
      category,
      amount,
      description,
      expense_date,
      created_at,
      updated_at
    FROM expenses
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
    `,
		[userId],
	);

	const expenses = rows as Expense[];

	if (expenses.length === 0) {
		throw new Error("EXPENSE_CREATION_FAILED");
	}

	return expenses[0];
};

export const getExpenses = async (userId: string, filters: ExpenseQueryInput): Promise<Expense[]> => {
	let sql = `
    SELECT
      id,
      user_id,
      category,
      amount,
      description,
      expense_date,
      created_at,
      updated_at
    FROM expenses
    WHERE user_id = ?
  `;

	const params: unknown[] = [userId];

	if (filters.category) {
		sql += " AND category = ?";
		params.push(filters.category);
	}

	if (filters.from) {
		sql += " AND expense_date >= ?";
		params.push(filters.from);
	}

	if (filters.to) {
		sql += " AND expense_date <= ?";
		params.push(filters.to);
	}

	sql += " ORDER BY expense_date DESC, created_at DESC";

	const [rows] = await pool.execute(sql, params);

	return rows as Expense[];
};

export const getExpenseById = async (userId: string, expenseId: string): Promise<Expense> => {
	const [rows] = await pool.execute(
		`
    SELECT
      id,
      user_id,
      category,
      amount,
      description,
      expense_date,
      created_at,
      updated_at
    FROM expenses
    WHERE id = ?
      AND user_id = ?
    LIMIT 1
    `,
		[expenseId, userId],
	);

	const expenses = rows as Expense[];

	if (expenses.length === 0) {
		throw new Error("EXPENSE_NOT_FOUND");
	}

	return expenses[0];
};

export const updateExpense = async (userId: string, expenseId: string, input: UpdateExpenseInput): Promise<Expense> => {
	const { category, amount, description, expense_date } = input;

	const [result] = await pool.execute(
		`
    UPDATE expenses
    SET
      category = ?,
      amount = ?,
      description = ?,
      expense_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
      AND user_id = ?
    `,
		[category, amount, description ?? null, expense_date, expenseId, userId],
	);

	const updateResult = result as {
		affectedRows: number;
	};

	if (updateResult.affectedRows === 0) {
		throw new Error("EXPENSE_NOT_FOUND");
	}

	return getExpenseById(userId, expenseId);
};

export const deleteExpense = async (userId: string, expenseId: string): Promise<void> => {
	const [result] = await pool.execute(
		`
    DELETE FROM expenses
    WHERE id = ?
      AND user_id = ?
    `,
		[expenseId, userId],
	);

	const deleteResult = result as {
		affectedRows: number;
	};

	if (deleteResult.affectedRows === 0) {
		throw new Error("EXPENSE_NOT_FOUND");
	}
};
