const express = require("express");
const router = express.Router();
const { index, find, create, update, destroy } = require("./controller");
const {
    authenticatedUser,
    authorizeRoles,
} = require("../../../middlewares/auth");

const productParent2Prefix = "/productParent2"; 

// GET ALL (Index)
router.get(
    productParent2Prefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru"),
    index
);

// GET ONE (Find)
router.get(
    `${productParent2Prefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin", "Guru"),
    find
);

// POST (Create)
router.post(
    productParent2Prefix,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"),
    create
);

// PATCH (Update)
router.patch( 
    `${productParent2Prefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin", "Admin"),
    update
);

// DELETE (Destroy)
router.delete(
    `${productParent2Prefix}/:id`,
    authenticatedUser,
    authorizeRoles("Super Admin"), 
    destroy
);

module.exports = router;