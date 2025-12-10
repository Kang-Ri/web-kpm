const {
    getAllUsers,
    createUser,
    getOneUser,
    updateUser,
    deleteUser,
} = require('../../../services/mysql/usersManagement');

// Controller untuk Admin/Super Admin mengelola daftar user

const index = async (req, res, next) => {
    try {
        const result = await getAllUsers();

        res.status(200).json({
            message: 'Berhasil mendapatkan semua data user',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

const create = async (req, res, next) => {
    try {
        const result = await createUser(req.body);

        res.status(201).json({
            message: 'Berhasil menambahkan user baru',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

const find = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await getOneUser(id);

        res.status(200).json({
            message: 'Berhasil mendapatkan detail user',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await updateUser(id, req.body);

        res.status(200).json({
            message: 'Berhasil mengubah data user',
            data: result,
        });
    } catch (err) {
        next(err);
    }
};

const destroy = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deleteUser(id);

        res.status(200).json({
            message: 'Berhasil menghapus user',
        });
    } catch (err) {
        next(err);
    }
};

module.exports = {
    index,
    create,
    find,
    update,
    destroy,
};