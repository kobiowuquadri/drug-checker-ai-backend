export interface BaseResponse {
    message: string;
    success: boolean;
    statusCode: number;
    data: any;
}

export interface RegisterRequest {
    email: string;
    password: string;
}

export type RegisterResponse = BaseResponse;

export interface LoginRequest {
    email: string;
    password: string;
}

export type LoginResponse = BaseResponse;