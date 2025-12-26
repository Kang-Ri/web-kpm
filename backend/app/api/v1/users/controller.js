const { StatusCodes } = require("http-status-codes");
const {
    getProfile,
    updatePassword,
} = require("../../../services/mysql/user");

// --- 1. Get User Profile ---
const profile = async (req, res, next) => {
    try {
        const result = await getProfile(req);

        res.status(StatusCodes.OK).json({
            message: "Data profil berhasil diambil.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 2. Update Password ---
const changePassword = async (req, res, next) => {
    try {
        await updatePassword(req);

        res.status(StatusCodes.OK).json({
            message: "Password berhasil diubah.",
        });
    } catch (error) {
        next(error);
    }
};

// --- 3. Get Current User with Siswa Data (for auto-fill) ---
const getMe = async (req, res, next) => {
    try {
        const User = require('../user/model');
        const Siswa = require('../siswa/model');

        // Get user with siswa data
        const user = await User.findOne({
            where: { idUser: req.user.idUser },
            attributes: ['idUser', 'email', 'namaLengkap', 'role'],
            include: [{
                model: Siswa,
                as: 'siswa',
                attributes: [
                    'idSiswa',
                    'nama_lengkap',
                    'email',
                    'no_hp',
                    'tanggal_lahir',
                    'jenis_kelamin',
                    'alamat',
                    'kelas',
                    'nama_ortu',
                    'pekerjaan_ortu'
                ]
            }]
        });

        if (!user) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'User tidak ditemukan'
            });
        }

        res.status(StatusCodes.OK).json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    profile,
    changePassword,
    getMe,
};