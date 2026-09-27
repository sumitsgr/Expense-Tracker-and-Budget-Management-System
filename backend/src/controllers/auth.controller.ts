import { Request, Response } from "express";
import pool from "../config/database";
import { registerSchema, loginSchema } from "../validators/auth.validator";
import { registerUser, refreshAccessToken, loginUser, logoutUser } from "../services/auth.service";
import { AuthenticatedRequest } from "../middleware/auth.middleware";
import { User } from "../types/user";

export const register = async (req: Request, res: Response): Promise<void> => {
	try {
		const validationResult = registerSchema.safeParse(req.body);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validationResult.error.flatten(),
			});

			return;
		}

		const user = await registerUser(validationResult.data);

		res.status(201).json({
			success: true,
			message: "User registered successfully",
			data: {
				user,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "EMAIL_ALREADY_EXISTS") {
			res.status(409).json({
				success: false,
				message: "Email is already registered",
			});

			return;
		}

		console.error("Register error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const login = async (req: Request, res: Response): Promise<void> => {
	try {
		const validationResult = loginSchema.safeParse(req.body);

		if (!validationResult.success) {
			res.status(400).json({
				success: false,
				message: "Validation failed",
				errors: validationResult.error.flatten(),
			});

			return;
		}

		const result = await loginUser(validationResult.data);

		res.cookie("refreshToken", result.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.status(200).json({
			success: true,
			message: "Login successful",
			data: {
				user: result.user,
				accessToken: result.accessToken,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "INVALID_CREDENTIALS") {
			res.status(401).json({
				success: false,
				message: "Invalid email or password",
			});

			return;
		}

		console.error("Login error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const getMe = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
	try {
		if (!req.userId) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const [users] = await pool.query(
			`
      SELECT
        id,
        name,
        email,
        created_at,
        updated_at
      FROM users
      WHERE id = ?
      LIMIT 1
      `,
			[req.userId],
		);

		const foundUsers = users as Omit<User, "password_hash">[];

		if (foundUsers.length === 0) {
			res.status(404).json({
				success: false,
				message: "User not found",
			});

			return;
		}

		res.status(200).json({
			success: true,
			data: {
				user: foundUsers[0],
			},
		});
	} catch (error) {
		console.error("Get me error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const logout = async (req: Request, res: Response): Promise<void> => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (refreshToken) {
			await logoutUser(refreshToken);
		}

		res.clearCookie("refreshToken", {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
		});

		res.status(200).json({
			success: true,
			message: "Logout successful",
		});
	} catch (error) {
		console.error("Logout error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};

export const refresh = async (req: Request, res: Response): Promise<void> => {
	try {
		const refreshToken = req.cookies.refreshToken;

		if (!refreshToken) {
			res.status(401).json({
				success: false,
				message: "Refresh token required",
			});

			return;
		}

		const result = await refreshAccessToken(refreshToken);

		res.cookie("refreshToken", result.refreshToken, {
			httpOnly: true,
			secure: process.env.NODE_ENV === "production",
			sameSite: "lax",
			maxAge: 7 * 24 * 60 * 60 * 1000,
		});

		res.status(200).json({
			success: true,
			data: {
				accessToken: result.accessToken,
			},
		});
	} catch (error) {
		if (error instanceof Error && error.message === "INVALID_REFRESH_TOKEN") {
			res.clearCookie("refreshToken", {
				httpOnly: true,
				secure: process.env.NODE_ENV === "production",
				sameSite: "lax",
			});

			res.status(401).json({
				success: false,
				message: "Invalid or expired refresh token",
			});

			return;
		}

		console.error("Refresh error:", error);

		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};
