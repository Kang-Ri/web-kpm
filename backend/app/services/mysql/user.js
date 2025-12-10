const Users = require('../../api/v1/users/model');
const { NotFoundError, BadRequestError, UnauthenticatedError } = require('../../errors');
const bcrypt = require('bcryptjs'); 

/**
 * Mendapatkan data profil user yang sedang login.
 * @param {object} req - Objek request dari Express
 * @returns {object} Data user tanpa password.
 */
const getProfile = async (req) => {
    // ID User diambil dari payload JWT yang dilampirkan oleh middleware
    const { idUser } = req.user; 

    const user = await Users.findOne({ 
        where: { idUser },
        attributes: { exclude: ['password'] } // Kecualikan password dari hasil
    });

    if (!user) {
        // Ini jarang terjadi jika autentikasi berhasil, tapi penting untuk cek
        throw new NotFoundError(`User dengan ID ${idUser} tidak ditemukan.`);
    }

    // Ubah hasil Sequelize menjadi JSON biasa dan kembalikan
    return user.toJSON();
};

/**
 * Mengubah password user yang sedang login.
 * Memerlukan password lama untuk verifikasi.
 * @param {object} req - Objek request dari Express
 * @returns {boolean} Status keberhasilan update.
 */
const updatePassword = async (req) => {
    const { idUser } = req.user; 
    const { oldPassword, newPassword } = req.body;
    

    if (!oldPassword || !newPassword) {
        throw new BadRequestError('Mohon lengkapi password lama dan password baru.');
    }

    // 1. Cari user di database
    const user = await Users.findOne({ where: { idUser } });

    if (!user) {
        throw new NotFoundError(`User dengan ID ${idUser} tidak ditemukan.`);
    }

    // 2. Verifikasi Password Lama
    const isPasswordCorrect = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordCorrect) {
        throw new UnauthenticatedError('Password lama Anda salah.');
    }
    
    // 3. Hash Password Baru
    const salt = await bcrypt.genSalt(10);
    const newHashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Update Password di database
    await Users.update(
        { password: newHashedPassword }, 
        { where: { idUser } }
    );

    return true; // Berhasil
};

module.exports = {
    getProfile,
    updatePassword,
};