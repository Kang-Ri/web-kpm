import apiClient from './client';

export interface LoginCredentials {
    email: string;
    password: string;
}

export interface LoginResponse {
    message: string;
    data: {
        user: {
            idUser: number;
            email: string;
            namaLengkap: string;
            role: string;
        };
        accessToken: string;
        refreshToken: string;
    };
}

export interface RefreshTokenResponse {
    message: string;
    data: {
        accessToken: string;
    };
}

export const authService = {
    login: async (credentials: LoginCredentials): Promise<LoginResponse> => {
        const response = await apiClient.post('/cms/auth/login', credentials);
        console.log("response auth", response);
        return response.data;
    },

    logout: async (): Promise<void> => {
        await apiClient.get('/cms/auth/logout');
    },

    refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
        const response = await apiClient.post('/cms/auth/refresh-token', { refreshToken });
        console.log("response refresh token", response);
        return response.data;
    },
};
