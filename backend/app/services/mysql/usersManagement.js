const Users = require('../../api/v1/users/model');
const Roles = require('../../api/v1/roles/model'); // Asumsi model Roles sudah dibuat
const { NotFoundError, BadRequestError } = require('../../errors');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');

/**
 * Memastikan ID Role yang dimasukkan user ada di database.
 * @param {number} idRole - ID Role yang akan dicek.
 */
const checkRoleExistence = async (idRole) => {
    const role = await Roles.findOne({ where: { idRole } });
    if (!role) {
        throw new NotFoundError(`ID Role: ${idRole} tidak ditemukan.`);
    }
    return role;
};

/**
 * 1. Mendapatkan semua daftar user dengan pagination & filter
 */
const getAllUsers = async (req) => {
    const { search, role, page = 1, limit = 10 } = req.query;

    let whereClause = {};

    if (search) {
        whereClause = {
            ...whereClause,
            [Op.or]: [
                { namaLengkap: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ]
        };
    }

    let roleClause = {};
    if (role) {
        if (role.includes(',')) {
            roleClause.namaRole = { [Op.in]: role.split(',') };
        } else {
            roleClause.namaRole = role; // Contoh: 'Guru' atau 'Admin'
        }
    }

    const pageNumber = parseInt(page, 10);
    const limitNumber = parseInt(limit, 10);
    const offset = (pageNumber - 1) * limitNumber;

    const result = await Users.findAndCountAll({
        where: whereClause,
        attributes: { exclude: ['password'] },
        include: {
            model: Roles,
            as: 'role',
            attributes: ['idRole', 'namaRole'],
            where: Object.keys(roleClause).length > 0 ? roleClause : undefined,
        },
        order: [['namaLengkap', 'ASC']],
        limit: limitNumber,
        offset: offset,
    });

    return {
        data: result.rows,
        total: result.count,
        pages: Math.ceil(result.count / limitNumber),
        page: pageNumber,
    };
};

/**
 * 2. Membuat user baru (Create)
 * Hanya Admin/Super Admin yang bisa memanggil ini.
 * @param {object} reqBody - Data user baru (email, password, idRole, namaLengkap).
 * @returns {object} Data user yang berhasil dibuat.
 */
const createUser = async (reqBody) => {
    const { email, password, idRole, namaLengkap } = reqBody;

    // 1. Cek apakah role id yang dimasukkan valid
    await checkRoleExistence(idRole);

    // 2. Cek duplikasi email
    const isEmailExist = await Users.findOne({ where: { email } });
    if (isEmailExist) {
        throw new BadRequestError(`Email: ${email} sudah terdaftar.`);
    }

    // 3. Hash Password 
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // 4. Simpan ke database
    const result = await Users.create({ 
        email, 
        password : hashedPassword,
        idRole, 
        namaLengkap 
    });

    // 5. Bersihkan password sebelum dikembalikan
    const userResult = result.toJSON();
    delete userResult.password; 
    
    return userResult;
};

/**
 * 3. Mendapatkan user berdasarkan ID (Read One)
 * @param {number} id - ID User.
 * @returns {object} Data user tanpa password.
 */
const getOneUser = async (id) => {
    const result = await Users.findOne({
        where: { idUser: id },
        attributes: { exclude: ['password'] },
        include: {
            model: Roles,
            as: 'role',
            attributes: ['idRole', 'namaRole'],
        },
    });

    if (!result) {
        throw new NotFoundError(`User dengan ID: ${id} tidak ditemukan.`);
    }

    return result;
};


/**
 * 4. Mengubah user berdasarkan ID (Update)
 * @param {number} id - ID User.
 * @param {object} reqBody - Data user yang diubah.
 * @returns {object} Data user yang berhasil diubah.
 */
const updateUser = async (id, reqBody) => {
    console.log(id, reqBody);

    const { email, idRole, namaLengkap, password } = reqBody;

    // 1. Cek user ada atau tidak
    let user = await Users.findOne({ where: { idUser: id } });
    if (!user) {
        throw new NotFoundError(`User dengan ID: ${id} tidak ditemukan.`);
    }

    // 2. Siapkan object update kosong
    let updateData = {};

    // --- UPDATE EMAIL JIKA ADA ---
    if (email) {
        // Cek duplikasi email
        const isEmailExist = await Users.findOne({ where: { email } });
        if (isEmailExist && isEmailExist.idUser !== user.idUser) {
            throw new BadRequestError(`Email: ${email} sudah digunakan oleh user lain.`);
        }
        updateData.email = email;
    }

    // --- UPDATE ROLE JIKA ADA ---
    if (idRole) {
        // Cek role ID valid
        await checkRoleExistence(idRole);
        updateData.idRole = idRole;
    }

    // --- UPDATE NAMA JIKA ADA ---
    if (namaLengkap) {
        updateData.namaLengkap = namaLengkap;
    }

    // --- UPDATE PASSWORD JIKA ADA ---
    if (password) {
        updateData.password = await bcrypt.hash(password, 10);
    }

    // Jika tidak ada data yang diupdate
    if (Object.keys(updateData).length === 0) {
        throw new BadRequestError("Tidak ada field yang dikirim untuk di-update.");
    }

    // 3. Lakukan update
    await Users.update(updateData, { where: { idUser: id } });

    // 4. Ambil dan kirim data terbaru
    user = await getOneUser(id);
    return user;
};


/**
 * 5. Menghapus user berdasarkan ID (Delete)
 * @param {number} id - ID User.
 * @returns {boolean} Status keberhasilan.
 */
const deleteUser = async (id) => {
    // 1. Cek apakah user ada
    const user = await Users.findOne({ where: { idUser: id } });

    if (!user) {
        throw new NotFoundError(`User dengan ID: ${id} tidak ditemukan.`);
    }

    // 2. Hapus
    await Users.destroy({ where: { idUser: id } });

    return true;
};


module.exports = {
    getAllUsers,
    createUser,
    getOneUser,
    updateUser,
    deleteUser,
};