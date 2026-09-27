import pool from "../config/database";

import { CategoryBreakdown, DashboardData, RecentExpense } from "../types/dashboard";
import { fromCents, toCents } from "../utils/money";

export const getDashboard = async (userId: string, month: number, year: number): Promise<DashboardData> => {
	const [expenseTotalRows] = await pool.execute(
		`
    SELECT
      COALESCE(SUM(amount), 0) AS total_spent
    FROM expenses
    WHERE user_id = ?
      AND MONTH(expense_date) = ?
      AND YEAR(expense_date) = ?
    `,
		[userId, month, year],
	);

	const expenseTotals = expenseTotalRows as {
		total_spent: string;
	}[];

	const totalSpent = expenseTotals[0]?.total_spent ?? "0.00";

	const [budgetTotalRows] = await pool.execute(
		`
    SELECT
      COALESCE(SUM(amount), 0) AS total_budget
    FROM budgets
    WHERE user_id = ?
      AND month = ?
      AND year = ?
    `,
		[userId, month, year],
	);

	const budgetTotals = budgetTotalRows as {
		total_budget: string;
	}[];

	const totalBudget = budgetTotals[0]?.total_budget ?? "0.00";
	const remainingBudget = fromCents(toCents(totalBudget) - toCents(totalSpent));

	const [categoryRows] = await pool.execute(
		`
    SELECT
      category,
      COALESCE(SUM(amount), 0) AS spent
    FROM expenses
    WHERE user_id = ?
      AND MONTH(expense_date) = ?
      AND YEAR(expense_date) = ?
    GROUP BY category
    ORDER BY spent DESC
    `,
		[userId, month, year],
	);

	const categoryExpenses = categoryRows as {
		category: string;
		spent: string;
	}[];

	const [budgetRows] = await pool.execute(
		`
    SELECT
      category,
      amount AS budget
    FROM budgets
    WHERE user_id = ?
      AND month = ?
      AND year = ?
    `,
		[userId, month, year],
	);

	const categoryBudgets = budgetRows as {
		category: string;
		budget: string;
	}[];

	const categoryMap = new Map<
		string,
		{
			spent: string;
			budget: string;
		}
	>();

	for (const expense of categoryExpenses) {
		categoryMap.set(expense.category, {
			spent: expense.spent,
			budget: "0.00",
		});
	}
	for (const budget of categoryBudgets) {
		const existing = categoryMap.get(budget.category);

		if (existing) {
			existing.budget = budget.budget;
		} else {
			categoryMap.set(budget.category, {
				spent: "0.00",
				budget: budget.budget,
			});
		}
	}

	const categoryBreakdown: CategoryBreakdown[] = Array.from(categoryMap.entries()).map(([category, values]) => {
		const remaining = fromCents(toCents(values.budget) - toCents(values.spent));

		return {
			category,
			spent: values.spent,
			budget: values.budget,
			remaining,
		};
	});

	const [recentRows] = await pool.execute(
		`
    SELECT
      id,
      category,
      amount,
      description,
      expense_date
    FROM expenses
    WHERE user_id = ?
      AND MONTH(expense_date) = ?
      AND YEAR(expense_date) = ?
    ORDER BY expense_date DESC, created_at DESC
    LIMIT 5
    `,
		[userId, month, year],
	);

	const recentExpenses = recentRows as RecentExpense[];

	return {
		summary: {
			totalSpent,
			totalBudget,
			remainingBudget,
		},

		categoryBreakdown,

		recentExpenses,
	};
};
