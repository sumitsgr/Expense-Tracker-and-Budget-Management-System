import bcrypt from "bcryptjs";

import pool from "../config/database";
import { User } from "../types/user";
import { LoginInput, RegisterInput } from "../validators/auth.validator";
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from "../utils/jwt";
import { hashToken } from "../utils/token";

export interface AuthResult {
	user: Omit<User, "password_hash">;
	accessToken: string;
	refreshToken: string;
}

export const registerUser = async (input: RegisterInput): Promise<Omit<User, "password_hash">> => {
	const { name, email, password } = input;

	const [existingUsers] = await pool.query("SELECT id FROM users WHERE email = ? LIMIT 1", [email]);

	if (Array.isArray(existingUsers) && existingUsers.length > 0) {
		throw new Error("EMAIL_ALREADY_EXISTS");
	}

	const passwordHash = await bcrypt.hash(password, 12);

	await pool.query(
		`
    INSERT INTO users (
      name,
      email,
      password_hash
    )
    VALUES (?, ?, ?)
    `,
		[name, email, passwordHash],
	);

	const [users] = await pool.query(
		`
    SELECT
      id,
      name,
      email,
      created_at,
      updated_at
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
		[email],
	);

	const createdUsers = users as Omit<User, "password_hash">[];

	if (createdUsers.length === 0) {
		throw new Error("USER_CREATION_FAILED");
	}

	return createdUsers[0];
};

export const loginUser = async (input: LoginInput): Promise<AuthResult> => {
	const { email, password } = input;

	const [users] = await pool.query(
		`
    SELECT
      id,
      name,
      email,
      password_hash,
      created_at,
      updated_at
    FROM users
    WHERE email = ?
    LIMIT 1
    `,
		[email],
	);

	const foundUsers = users as User[];

	if (foundUsers.length === 0) {
		throw new Error("INVALID_CREDENTIALS");
	}

	const user = foundUsers[0];

	const passwordMatches = await bcrypt.compare(password, user.password_hash);

	if (!passwordMatches) {
		throw new Error("INVALID_CREDENTIALS");
	}

	const accessToken = generateAccessToken(user.id);
	const refreshToken = generateRefreshToken(user.id);

	const refreshTokenHash = hashToken(refreshToken);

	await pool.query(
		`
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at
    )
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `,
		[user.id, refreshTokenHash],
	);

	const { password_hash: _, ...safeUser } = user;

	return {
		user: safeUser,
		accessToken,
		refreshToken,
	};
};

export const logoutUser = async (refreshToken: string): Promise<void> => {
	const tokenHash = hashToken(refreshToken);

	await pool.query(
		`
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE token_hash = ?
      AND revoked_at IS NULL
    `,
		[tokenHash],
	);
};

export const refreshAccessToken = async (
	refreshToken: string,
): Promise<{
	accessToken: string;
	refreshToken: string;
}> => {
	let payload;

	try {
		payload = verifyRefreshToken(refreshToken);
	} catch {
		throw new Error("INVALID_REFRESH_TOKEN");
	}

	const tokenHash = hashToken(refreshToken);

	const [tokens] = await pool.execute(
		`
    SELECT
      id,
      user_id,
      expires_at,
      revoked_at
    FROM refresh_tokens
    WHERE token_hash = ?
      AND user_id = ?
    LIMIT 1
    `,
		[tokenHash, payload.userId],
	);

	const storedTokens = tokens as {
		id: string;
		user_id: string;
		expires_at: Date;
		revoked_at: Date | null;
	}[];

	if (storedTokens.length === 0) {
		throw new Error("INVALID_REFRESH_TOKEN");
	}

	const storedToken = storedTokens[0];

	if (storedToken.revoked_at !== null) {
		throw new Error("INVALID_REFRESH_TOKEN");
	}

	if (new Date(storedToken.expires_at) <= new Date()) {
		throw new Error("INVALID_REFRESH_TOKEN");
	}

	/*
	 * Revoke the old refresh token.
	 */
	await pool.execute(
		`
    UPDATE refresh_tokens
    SET revoked_at = NOW()
    WHERE id = ?
    `,
		[storedToken.id],
	);

	/*
	 * Generate a completely new token pair.
	 */
	const newAccessToken = generateAccessToken(payload.userId);
	const newRefreshToken = generateRefreshToken(payload.userId);

	const newRefreshTokenHash = hashToken(newRefreshToken);

	/*
	 * Store the new refresh token hash.
	 */
	await pool.execute(
		`
    INSERT INTO refresh_tokens (
      user_id,
      token_hash,
      expires_at
    )
    VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))
    `,
		[payload.userId, newRefreshTokenHash],
	);

	return {
		accessToken: newAccessToken,
		refreshToken: newRefreshToken,
	};
};
