export interface AuthenticatedUser {
	id: string;
	name: string;
	email: string;
}

export interface AccessTokenPayload {
	userId: string;
}

export interface RefreshTokenPayload {
	userId: string;
}
