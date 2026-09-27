export interface DashboardSummary {
	totalSpent: string;
	totalBudget: string;
	remainingBudget: string;
}

export interface CategoryBreakdown {
	category: string;
	spent: string;
	budget: string;
	remaining: string;
}

export interface RecentExpense {
	id: string;
	category: string;
	amount: string;
	description: string | null;
	expense_date: string;
}

export interface DashboardData {
	summary: DashboardSummary;
	categoryBreakdown: CategoryBreakdown[];
	recentExpenses: RecentExpense[];
}
