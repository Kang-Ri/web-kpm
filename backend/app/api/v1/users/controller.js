const { StatusCodes } = require("http-status-codes");
const { 
    getProfile,
    updatePassword,
} = require("../../../services/mysql/user"); 

// --- 1. Get User Profile ---
const profile = async (req, res, next) => {
    try {
        const result = await getProfile(req);

        res.status(StatusCodes.OK).json({
            message: "Data profil berhasil diambil.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 2. Update Password ---
const changePassword = async (req, res, next) => {
    try {
        await updatePassword(req);

        res.status(StatusCodes.OK).json({
            message: "Password berhasil diubah.",
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    profile,
    changePassword,
};