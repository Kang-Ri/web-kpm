// api/v1/parentProduct1/router.js

const express = require("express");
const router = express.Router();
const { index, find, create, update, destroy } = require("./controller");
const {
    authenticatedUser,
    authorizeRoles,
} = require("../../../middlewares/auth");

const productParent1Prefix = "/productParent1"; // Sesuaikan dengan kebutuhan URL Anda

// GET ALL (Index)
router.get(
    productParent1Prefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru"), // Guru mungkin hanya READ
    index
);

// GET ONE (Find)
router.get(
    `${productParent1Prefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru"),
    find
);

// POST (Create)
router.post(
    productParent1Prefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"),
    create
);

// PUT/PATCH (Update)
router.patch(
    `${productParent1Prefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"),
    update
);

// DELETE (Destroy)
router.delete(
    `${productParent1Prefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin"), // Biasanya hanya Super Admin yang boleh DELETE
    destroy
);

module.exports = router;