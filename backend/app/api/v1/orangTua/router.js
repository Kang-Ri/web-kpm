const express = require('express');
const router = express.Router();
const {
    create,
    findBySiswa,
    update,
    destroy,
} = require('./controller');

// CREATE OrangTua
router.post(
    '/orang-tua',
    create
);

// GET OrangTua by Siswa
router.get(
    '/siswa/:idSiswa/orang-tua',
    findBySiswa
);

// UPDATE OrangTua
router.patch(
    '/orang-tua/:idOrangTua',
    update
);

// DELETE OrangTua
router.delete(
    '/orang-tua/:idOrangTua',
    destroy
);

module.exports = router;
