export interface BaseResponse {
    message: string;
    success: boolean;
    statusCode: number;
    data: any;
}

export interface RegisterRequest {
    name: string;
    email: string;
    password: string;
}

export type RegisterResponse = BaseResponse;

export interface LoginRequest {
    email: string;
    password: string;
}

export type LoginResponse = BaseResponse;

export interface RefreshTokenRequest {
    refreshToken?: string;
}

export type RefreshTokenResponse = BaseResponse;
