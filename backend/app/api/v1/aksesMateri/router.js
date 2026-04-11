const express = require('express');
const router = express.Router();
const {
    grant,
    index,
    find,
    getSiswaList,
    exportSiswa,
    revoke,
    destroy,
} = require('./controller');

const { authenticatedUser } = require('../../../middlewares/auth');

// GRANT Access (Unlock)
router.post(
    '/akses-materi/grant',
    grant
);

// GET ALL Access
router.get(
    '/akses-materi',
    index
);

// GET Siswa List by Materi (for modal display)
router.get(
    '/materi/:idProduk/siswa',
    authenticatedUser,
    getSiswaList
);

// EXPORT Siswa by Materi to Excel
router.get(
    '/materi/:idProduk/siswa/export',
    authenticatedUser,
    exportSiswa
);

// Alias for un-refreshed frontend caches sending ?idProduk=3
router.get(
    '/akses-materi/siswa',
    authenticatedUser,
    getSiswaList
);

// GET ONE Access
router.get(
    '/akses-materi/:idAkses',
    find
);

// REVOKE Access (Lock)
router.patch(
    '/akses-materi/:idAkses/revoke',
    revoke
);

// DELETE Access
router.delete(
    '/akses-materi/:idAkses',
    destroy
);

module.exports = router;
