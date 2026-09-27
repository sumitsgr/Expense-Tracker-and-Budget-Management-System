import jwt from "jsonwebtoken";

interface TokenPayload {
	userId: string;
}

const getAccessSecret = (): string => {
	const secret = process.env.JWT_ACCESS_SECRET;

	if (!secret) {
		throw new Error("JWT_ACCESS_SECRET is not configured");
	}

	return secret;
};

const getRefreshSecret = (): string => {
	const secret = process.env.JWT_REFRESH_SECRET;

	if (!secret) {
		throw new Error("JWT_REFRESH_SECRET is not configured");
	}

	return secret;
};

export const generateAccessToken = (userId: string): string => {
	const payload: TokenPayload = {
		userId,
	};

	return jwt.sign(payload, getAccessSecret(), {
		expiresIn: "15m",
	});
};

export const generateRefreshToken = (userId: string): string => {
	const payload: TokenPayload = {
		userId,
	};

	return jwt.sign(payload, getRefreshSecret(), {
		expiresIn: "7d",
	});
};

export const verifyAccessToken = (token: string): TokenPayload => {
	return jwt.verify(token, getAccessSecret()) as TokenPayload;
};

export const verifyRefreshToken = (token: string): TokenPayload => {
	return jwt.verify(token, getRefreshSecret()) as TokenPayload;
};
