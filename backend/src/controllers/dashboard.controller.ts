import { Response } from "express";

import { AuthenticatedRequest } from "../middleware/auth.middleware";

import { getDashboard } from "../services/dashboard.service";

import { dashboardQuerySchema } from "../validators/dashboard.validator";

export const get = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const validation = dashboardQuerySchema.safeParse(req.query);

		if (!validation.success) {
			res.status(400).json({
				success: false,
				message: "Invalid dashboard filters",
				errors: validation.error.flatten(),
			});

			return;
		}

		const { month, year } = validation.data;

		const dashboard = await getDashboard(req.userId, month, year);

		res.status(200).json({
			success: true,
			data: dashboard,
		});
	} catch (error) {
		console.error("Dashboard error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
