export interface Expense {
	id: string;
	user_id: string;
	category: string;
	amount: string;
	description: string | null;
	expense_date: Date;
	created_at: Date;
	updated_at: Date;
}
