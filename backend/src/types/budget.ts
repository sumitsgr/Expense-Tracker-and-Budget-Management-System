export interface Budget {
	id: string;
	user_id: string;
	category: string;
	amount: string;
	month: number;
	year: number;
	created_at: Date;
	updated_at: Date;
}
