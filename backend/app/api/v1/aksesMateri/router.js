const express = require('express');
const router = express.Router();
const {
    grant,
    index,
    find,
    revoke,
    destroy,
} = require('./controller');

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
