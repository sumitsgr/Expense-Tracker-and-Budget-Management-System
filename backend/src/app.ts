import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

import authRoutes from "./routes/auth.routes";
import expenseRoutes from "./routes/expense.routes";
import budgetRoutes from "./routes/budget.routes";
import dashboardRoutes from "./routes/dashboard.routes";

const app = express();

app.use(
	cors({
		origin: "http://localhost:5173",
		credentials: true,
	}),
);

app.use(express.json());
app.use(cookieParser());

app.get("/api/health", (_req, res) => {
	res.status(200).json({
		success: true,
		message: "Expense Tracker API is running",
	});
});

app.use("/api/auth", authRoutes);
app.use("/api/expenses", expenseRoutes);
app.use("/api/budgets", budgetRoutes);
app.use("/api/dashboard", dashboardRoutes);

export default app;
