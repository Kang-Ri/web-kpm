// app/api/v1/formFields/router.js
const express = require('express');
const router = express.Router();
const { create, index, update, destroy } = require('./controller');
const { authenticatedUser, authorizeRoles } = require('../../../middlewares/auth');

// POST /api/v1/cms/forms/:idForm/fields
router.post('/forms/:idForm/fields',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    create
);

// GET /api/v1/cms/forms/:idForm/fields
router.get('/forms/:idForm/fields',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    index
);

// PATCH /api/v1/cms/form-fields/:idField
router.patch('/form-fields/:idField',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    update
);

// DELETE /api/v1/cms/form-fields/:idField
router.delete('/form-fields/:idField',
    authenticatedUser,
    authorizeRoles('Super Admin', 'Admin'),
    destroy
);

module.exports = router;