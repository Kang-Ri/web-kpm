const express = require("express");
const router = express.Router();
const { index, find, create, update, destroy } = require("./controller");
const {
    authenticatedUser,
    authorizeRoles,
} = require("../../../middlewares/auth");

const productPrefix = "/product"; 

// GET ALL (Index)
router.get(
    productPrefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru", "PJ"),
    index
);

// GET ONE (Find)
router.get(
    `${productPrefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru", "PJ"),
    find
);

// POST (Create)
router.post(
    productPrefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "PJ"),
    create
);

// PATCH (Update)
router.patch( 
    `${productPrefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "PJ"),
    update
);

// DELETE (Destroy)
router.delete(
    `${productPrefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin"), 
    destroy
);

module.exports = router;