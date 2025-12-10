const { StatusCodes } = require("http-status-codes");
const {
    signUp,
    signIn,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken
} = require("../../../services/mysql/auth");
const { attachCookiesToResponse } = require('../../../utils'); // Asumsi utilitas cookie ada di sini

// --- 1. Register (Sign Up) ---
const register = async (req, res, next) => {
    try {
        const result = await signUp(req);

        res.status(StatusCodes.CREATED).json({
            message: "Pendaftaran Berhasil! Silakan masuk.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 2. Login (Sign In) ---
const login = async (req, res, next) => {
    try {
        const result = await signIn(req);

        // Pasang Refresh Token ke cookie
        attachCookiesToResponse({ res, user: result.user, refreshToken: result.refreshToken });

        res.status(StatusCodes.OK).json({
            message: "Selamat datang kembali!",
            data: {
                user: result.user,
                accessToken: result.token, // Frontend expects 'accessToken'
                refreshToken: result.refreshToken, // Frontend expects 'refreshToken'
            },
        });
    } catch (error) {
        next(error);
    }
};

// --- 3. Logout ---
const userLogout = async (req, res, next) => {
    try {
        await logout(req);

        // Hapus cookie Refresh Token dari browser user
        res.cookie('refreshToken', 'logout', {
            httpOnly: true,
            expires: new Date(Date.now()), // Kedaluwarsa segera
        });

        res.status(StatusCodes.OK).json({
            message: "Anda berhasil keluar.",
        });
    } catch (error) {
        next(error);
    }
};

// --- 4. Forgot Password (Kirim OTP) ---
const sendOTP = async (req, res, next) => {
    try {
        await forgotPassword(req);

        res.status(StatusCodes.OK).json({
            message: "OTP telah dikirim ke email Anda. Silakan cek kotak masuk.",
        });
    } catch (error) {
        next(error);
    }
};

// --- 5. Reset Password (Ganti Password dengan OTP) ---
const updatePasswordWithOTP = async (req, res, next) => {
    try {
        await resetPassword(req);

        res.status(StatusCodes.OK).json({
            message: "Password berhasil diubah. Silakan masuk dengan password baru.",
        });
    } catch (error) {
        next(error);
    }
};

// --- 6. Refresh Token ---
const refresh = async (req, res, next) => {
    try {
        const result = await refreshToken(req);

        // Tidak perlu set cookie baru, cukup kembalikan Access Token baru
        res.status(StatusCodes.OK).json({
            message: "Access Token baru berhasil dibuat.",
            data: {
                token: result.token, // Access Token (JWT) baru
                user: result.user,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    register,
    login,
    userLogout,
    sendOTP,
    updatePasswordWithOTP,
    refresh
};