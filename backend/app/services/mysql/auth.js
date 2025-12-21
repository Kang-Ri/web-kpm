const Users = require('../../api/v1/users/model');
const Roles = require('../../api/v1/roles/model')
const RefreshTokens = require('../../api/v1/userRefreshTokens/model');
const PasswordResetTokens = require('../../api/v1/passwordResetTokens/model'); // Asumsi: Model ini sudah dibuat

const { BadRequestError, UnauthenticatedError, NotFoundError } = require('../../errors');
const bcrypt = require('bcryptjs');
const crypto = require('crypto'); // Untuk generate OTP
const { sendEmail } = require('../../services/email'); // Asumsi: Utility email ini sudah ada

// Mengimpor semua utilitas dari index.js
const {
    createJWT,
    createRefreshToken: createTokenString,
    createTokenUser
} = require('../../utils');

const { createRefreshToken, getOneRefreshToken } = require('./userRefreshToken');


const ROLE_ID_TO_NAME = {
    1: 'Super Admin',
    2: 'Admin',
    3: 'Guru',
    4: 'PJ', // Asumsi PJ adalah nama Role
    5: 'Siswa',
    // Tambahkan Role ke-6 jika ada, saat ini hanya 5 yang terlihat di screenshot
};

// --- 1. SIGN UP (Register) ---
const signUp = async (req) => {
    const { email, password, namaLengkap } = req.body;

    if (!email || !password || !namaLengkap) {
        throw new BadRequestError('Mohon lengkapi semua bidang: email, password, dan namaLengkap.');
    }

    // Cek duplikasi email
    const checkEmail = await Users.findOne({ where: { email } });
    if (checkEmail) {
        throw new BadRequestError('Email sudah terdaftar. Gunakan email lain.');
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Buat User Baru (Default Role: 5/Siswa)
    const result = await Users.create({
        email,
        password: hashedPassword,
        namaLengkap,
        idRole: 5,
        status: 'Aktif',
    });

    delete result.dataValues.password;
    return result;
};


// --- 2. SIGN IN (Login) ---
const signIn = async (req) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError('Mohon sediakan email dan password.');
    }

    const result = await Users.findOne({
        where: { email },
    });

    if (!result) {
        throw new UnauthenticatedError('Email Anda salah!');
    }

    if (result.status !== 'Aktif') {
        throw new UnauthenticatedError('Akun Anda belum aktif. Silakan hubungi administrator.');
    }

    const isPasswordCorrect = await bcrypt.compare(password, result.password);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Password Anda salah!');
    }

    // // Get role name from Roles table
    const role = await Roles.findByPk(result.idRole, {
        attributes: ['namaRole']
    });

    // // Attach role name to user object for createTokenUser
    // // IMPORTANT: Use dataValues to ensure it's accessible
    // result.dataValues.namaRole = role ? role.namaRole : 'Unknown';
    result.dataValues.namaRole = role ? role.dataValues.namaRole : 'Unknown';
    console.log("result", result);

    const tokenUser = createTokenUser(result.dataValues);
    const token = createJWT({ payload: tokenUser });
    console.log("tokenUser", tokenUser);
    const refreshTokenString = createTokenString({ payload: tokenUser });
    console.log("refreshTokenString", refreshTokenString);

    const payloadRefreshToken = {
        idUser: result.idUser,
        token: refreshTokenString,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    console.log("payloadRefreshToken", payloadRefreshToken);
    // Simpan/Update Refresh Token ke Database
    await createRefreshToken(payloadRefreshToken);

    return {
        token,
        refreshToken: refreshTokenString,
        user: {
            idUser: result.idUser,
            email: result.email,
            namaLengkap: result.namaLengkap,
            role: tokenUser.role,
        }
    };
};

// --- 3. LOGOUT ---
const logout = async (req) => {
    // Asumsi: controller akan mengambil token dari cookie/body
    const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!refreshToken) {
        return null;
    }

    // Hapus token dari database (Service userRefreshToken harus menyediakan fungsi destroy)
    await RefreshTokens.destroy({ where: { token: refreshToken } });

    return true;
};

// --- 4. FORGOT PASSWORD (Kirim OTP) ---
const forgotPassword = async (req) => {
    const { email } = req.body;

    const user = await Users.findOne({ where: { email } });

    if (!user) {
        throw new NotFoundError('Email tidak terdaftar.');
    }

    // 1. Buat Token OTP (6 digit angka)
    const otpToken = crypto.randomInt(100000, 999999).toString();
    const expires = new Date(Date.now() + 10 * 60 * 1000); // Kedaluwarsa dalam 10 menit

    // 2. Hapus token lama & Simpan token baru ke tabel PasswordResetTokens
    await PasswordResetTokens.destroy({ where: { idUser: user.idUser } });
    await PasswordResetTokens.create({
        idUser: user.idUser,
        token: otpToken,
        expiryDate: expires,
    });

    // 3. Kirim Email (Panggilan Service Email)
    // <-- Panggilan fungsi yang sama
    // await sendEmail({ 
    //     to: email,
    //     subject: 'Permintaan Reset Password - Kode OTP',
    //     html: `Halo ${user.namaLengkap},<br> Kode OTP Anda untuk reset password adalah: <strong>${otpToken}</strong>. Kode ini berlaku selama 10 menit. Abaikan email ini jika Anda tidak memintanya.`,
    // });

    return true;
};

// --- 5. RESET PASSWORD (Ganti Password dengan OTP) ---
const resetPassword = async (req) => {
    const { email, otp, newPassword } = req.body;

    // 1. Validasi input
    if (!email || !otp || !newPassword) {
        throw new BadRequestError('Mohon sediakan email, OTP, dan password baru.');
    }

    // 2. Cari User dan Token
    const user = await Users.findOne({ where: { email } });
    if (!user) {
        throw new NotFoundError('Email tidak terdaftar.');
    }

    const resetRecord = await PasswordResetTokens.findOne({
        where: { idUser: user.idUser, token: otp }
    });

    if (!resetRecord) {
        throw new UnauthenticatedError('Kode OTP tidak valid.');
    }

    // 3. Cek Kedaluwarsa Token
    if (new Date(resetRecord.expiryDate) < new Date()) {
        await resetRecord.destroy(); // Hapus token kadaluarsa
        throw new UnauthenticatedError('Kode OTP sudah kedaluwarsa. Silakan kirim permintaan baru.');
    }

    // 4. Hash Password Baru
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 5. Update Password User
    await Users.update({ password: hashedPassword }, {
        where: { idUser: user.idUser }
    });

    // 6. Hapus Token Reset setelah berhasil
    await resetRecord.destroy();

    return true;
};

// --- 6. REFRESH TOKEN ---
const refreshToken = async (req) => {
    console.log("masuk refresh token")
    // 1. Dapatkan dan validasi Refresh Token (menggunakan service userRefreshToken)
    // Service ini akan mencari token di DB dan memverifikasi string JWT-nya.
    const tokenRecord = await getOneRefreshToken(req); // Melempar error jika tidak valid/tidak ditemukan
    console.log("tokenRecord", tokenRecord)

    // 2. Dapatkan data User dari idUser yang ada di record token
    const user = await Users.findOne({
        where: { idUser: tokenRecord.idUser }
    });

    if (!user) {
        // Ini seharusnya tidak terjadi jika relasi DB terawat, tapi penting untuk cek keamanan
        throw new NotFoundError('User tidak ditemukan.');
    }

    // 3. Buat Payload User baru
    const tokenUser = createTokenUser(user);

    // 4. Buat Access Token (JWT) yang baru
    const newToken = createJWT({ payload: tokenUser });

    // 5. Kembalikan token baru
    return {
        token: newToken,
        user: {
            idUser: user.idUser,
            email: user.email,
            namaLengkap: user.namaLengkap,
            role: tokenUser.role,
        }
    };
};

module.exports = {
    signIn,
    signUp,
    logout,
    forgotPassword,
    resetPassword,
    refreshToken
};