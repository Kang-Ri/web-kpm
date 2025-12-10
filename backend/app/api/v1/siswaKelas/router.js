const express = require('express');
const router = express.Router();
const {
    create,
    index,
    find,
    update,
    destroy,
} = require('./controller');

// ENROLL Siswa ke Kelas
router.post(
    '/enrollments',
    create
);

// GET ALL Enrollments
router.get(
    '/enrollments',
    index
);

// GET ONE Enrollment
router.get(
    '/enrollments/:idSiswaKelas',
    find
);

// UPDATE Enrollment Status
router.patch(
    '/enrollments/:idSiswaKelas',
    update
);

// DELETE Enrollment
router.delete(
    '/enrollments/:idSiswaKelas',
    destroy
);

module.exports = router;
