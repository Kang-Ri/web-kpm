const express = require('express');
const router = express.Router();
const {
    create,
    index,
    getActive,
    find,
    update,
    destroy,
} = require('./controller');

// CREATE Button
router.post(
    '/materi-buttons',
    create
);

// GET ALL Buttons
router.get(
    '/materi-buttons',
    index
);

// GET ACTIVE Buttons untuk Materi tertentu (untuk siswa)
router.get(
    '/materi/:idProduk/buttons/active',
    getActive
);

// GET ONE Button
router.get(
    '/materi-buttons/:idButton',
    find
);

// UPDATE Button
router.patch(
    '/materi-buttons/:idButton',
    update
);

// DELETE Button
router.delete(
    '/materi-buttons/:idButton',
    destroy
);

module.exports = router;
