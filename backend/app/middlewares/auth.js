const { UnauthenticatedError, UnauthorizedError } = require("../errors");
const { isTokenValid } = require("../utils");

/**
 * Middleware untuk memverifikasi JWT dan memastikan pengguna telah login.
 * Menyimpan payload token ke req.user.
 */
const authenticatedUser = async (req, res, next) => {
    try {
        let token;

        // 1. Cek token di Header 'Authorization'
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer')) {
            throw new UnauthenticatedError("Autentikasi gagal. Token tidak ditemukan.");
        }
        
        // Ambil token setelah 'Bearer '
        token = authHeader.split(' ')[1];

        // 2. Verifikasi Token
        const payload = isTokenValid({ token });
        

        // 3. Tambahkan payload ke objek request
        req.user = payload; // req.user kini berisi { idUser, idRole, email, namaLengkap, etc. }
        
        next();
    } catch (error) {
        // Jika verifikasi gagal (token expired, signature salah), throw UnauthenticatedError
        throw new UnauthenticatedError(
            "Autentikasi gagal. Token tidak valid atau kedaluwarsa."
        );
    }
};

/**
 * Middleware untuk memverifikasi peran pengguna (role-based authorization).
 * @param {...string} roles - Daftar peran yang diizinkan (misal: "Super Admin", "Admin", "Guru").
 */
const authorizeRoles = (...roles) => {
    // Role Map (Berdasarkan data Roles yang sudah kita buat)
    const roleMap = {
        1: "Super Admin",
        2: "Admin",
        3: "Guru",
        4: "PJ",
        5: "Siswa",
    };
    // console.log(...roles)
    return (req, res, next) => {
        // 1. Dapatkan ID Role dari req.user (asumsi: JWT payload hanya membawa ID Role)
        const userRoleId = req.user.role; // Mengambil idRole dari payload JWT
        
        // 2. Map ID Role ke Nama Role
        const userRoleName = roleMap[userRoleId];
        console.log(userRoleName)
        // 3. Cek apakah peran pengguna termasuk dalam peran yang diizinkan
        if (!roles.includes(userRoleName)) {
            throw new UnauthorizedError(
                `Anda tidak memiliki izin untuk mengakses rute ini. Role Anda: ${userRoleName}.`
            );
        }
        
        next();
    };
};

module.exports = {
    authenticatedUser,
    authorizeRoles,
};