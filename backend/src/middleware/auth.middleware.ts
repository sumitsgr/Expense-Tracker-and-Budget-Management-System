import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";

export interface AuthenticatedRequest extends Request {
	userId?: string;
}

export const authenticate = (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
	try {
		const authorization = req.headers.authorization;

		if (!authorization) {
			res.status(401).json({
				success: false,
				message: "Authentication required",
			});

			return;
		}

		const [scheme, token] = authorization.split(" ");

		if (scheme !== "Bearer" || !token) {
			res.status(401).json({
				success: false,
				message: "Invalid authorization header",
			});

			return;
		}

		const payload = verifyAccessToken(token);

		req.userId = payload.userId;

		next();
	} catch {
		res.status(401).json({
			success: false,
			message: "Invalid or expired access token",
		});
	}
};
