const express = require('express');
const router = express.Router();

const {
    index,
    show,
    create,
    update,
    destroy,
    reorder
} = require('./controller');

const {
    authenticatedUser,
    authorizeRoles,
} = require("../../../middlewares/auth");

// Admin Authentication
const adminAuth = [authenticatedUser, authorizeRoles("Super Admin", "Admin")];

// GET All Templates
router.get('/variable-templates', adminAuth, index);

// GET One Template
router.get('/variable-templates/:id', adminAuth, show);

// POST Create Template
router.post('/variable-templates', adminAuth, create);

// PATCH Update Template
router.patch('/variable-templates/:id', adminAuth, update);

// DELETE Template
router.delete('/variable-templates/:id', adminAuth, destroy);

// PATCH Reorder Templates
router.patch('/variable-templates/reorder', adminAuth, reorder);

module.exports = router;
