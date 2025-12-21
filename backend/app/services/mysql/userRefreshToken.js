const RefreshTokens = require('../../api/v1/userRefreshTokens/model'); // Model Sequelize
const { NotFoundError } = require('../../errors');
const { isRefreshTokenValid } = require('../../utils'); // Menggunakan utils/index.js (yang mengimpor jwt.js)

// --- CREATE REFRESH TOKEN ---
const createRefreshToken = async (payload) => {
    console.log("payload in createRefreshToken", payload);
    const { idUser, token, expiryDate } = payload;

    // 1. Cek apakah user sudah punya token (kita hanya ingin satu token aktif per user)
    // Jika ada, kita hapus/timpa (destroy) token yang lama.
    await RefreshTokens.destroy({
        where: { idUser: idUser }
    });
    console.log("destroyed");
    // 2. Buat token baru di database menggunakan Sequelize .create()
    const result = await RefreshTokens.create({
        idUser,
        token,
        expiryDate,
    });
    console.log("created", result);
    return result;
};

// --- GET ONE REFRESH TOKEN ---
const getOneRefreshToken = async (req) => {
    // console.log( "OK ini => ", req.signedCookies.refreshToken)
    const refreshToken = req.signedCookies.refreshToken;
    // const refreshToken = req.cookies.refreshToken || req.body.refreshToken || req.signedCookies.refreshToken; // Ambil dari cookie atau body
    // console.log(refreshToken, " <== OK ini")
    if (!refreshToken) {
        throw new NotFoundError('Refresh Token tidak ditemukan');
    }

    // 1. Verifikasi token secara internal (apakah signature valid dan belum expired)
    let payload;
    try {
        payload = isRefreshTokenValid({ token: refreshToken }); // Menggunakan utilitas JWT
    } catch (error) {
        // Jika token tidak valid (misal: expired/signature salah), kita perlakukan sebagai NotFound
        throw new NotFoundError('Refresh Token tidak valid atau kedaluwarsa');
    }

    // 2. Cari token di database (pastikan token tersebut ada dan belum digunakan)
    const result = await RefreshTokens.findOne({
        where: {
            token: refreshToken,
            idUser: payload.idUser // Pastikan idUser sesuai dengan payload
        }
    });

    if (!result) {
        throw new NotFoundError('Refresh Token tidak ada dalam database');
    }

    // Pastikan token belum expired (walaupun isRefreshTokenValid sudah cek, ini adalah lapisan keamanan tambahan)
    if (new Date(result.expiryDate) < new Date()) {
        await result.destroy(); // Hapus token yang sudah basi
        throw new NotFoundError('Refresh Token sudah kedaluwarsa');
    }

    return result; // Mengembalikan record RefreshToken dari DB
};

// --- DELETE REFRESH TOKEN (Digunakan oleh Logout) ---
const deleteRefreshToken = async (refreshToken) => {
    await RefreshTokens.destroy({
        where: { token: refreshToken }
    });
    return true;
}


module.exports = {
    createRefreshToken,
    getOneRefreshToken,
    deleteRefreshToken,
};