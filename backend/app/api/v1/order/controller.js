const { StatusCodes } = require("http-status-codes");
const {
    createOrder,
    getAllOrders,
    getOrderDetail,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
} = require("../../../services/mysql/order");

// --- 1. Create Order ---
const create = async (req, res, next) => {
    try {
        const result = await createOrder(req);

        res.status(StatusCodes.CREATED).json({
            message: "Order berhasil dibuat.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 2. Get All Orders ---
const index = async (req, res, next) => {
    try {
        const result = await getAllOrders(req);

        res.status(StatusCodes.OK).json({
            message: "Data Order berhasil diambil.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 3. Get Order Detail ---
const find = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await getOrderDetail(id);

        res.status(StatusCodes.OK).json({
            message: "Detail Order berhasil diambil.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 4. Update Order Status ---
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const result = await updateOrderStatus(id, req.body);

        res.status(StatusCodes.OK).json({
            message: "Status Order berhasil diperbarui.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 5. Cancel Order (User) ---
const cancel = async (req, res, next) => {
    try {
        const result = await cancelOrder(req);

        res.status(StatusCodes.OK).json({
            message: "Order berhasil dibatalkan.",
            data: result,
        });
    } catch (error) {
        next(error);
    }
};

// --- 6. Confirm Payment & Activate Enrollment ---
const confirmPayment = async (req, res, next) => {
    try {
        const { id: idOrder } = req.params;
        const Order = require('../order/model');
        const SiswaKelas = require('../siswaKelas/model');

        // 1. Update order status
        const order = await Order.findByPk(idOrder);
        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: "Order tidak ditemukan."
            });
        }

        await order.update({
            statusPembayaran: 'Paid',
            statusOrder: 'Completed'
        });

        // 2. Activate enrollment if linked
        const siswaKelas = await SiswaKelas.findOne({
            where: { idOrderDaftarUlang: idOrder }
        });

        if (siswaKelas) {
            await siswaKelas.update({
                statusEnrollment: 'Aktif',
                sudahDaftarUlang: true
            });

            return res.status(StatusCodes.OK).json({
                message: "Pembayaran berhasil dikonfirmasi. Status enrollment diaktifkan.",
                data: {
                    order,
                    enrollment: {
                        idSiswaKelas: siswaKelas.idSiswaKelas,
                        statusEnrollment: 'Aktif'
                    }
                }
            });
        }

        res.status(StatusCodes.OK).json({
            message: "Pembayaran berhasil dikonfirmasi.",
            data: order
        });
    } catch (error) {
        next(error);
    }
};

// --- 7. Delete Order (Admin) ---
const destroy = async (req, res, next) => {
    try {
        const { id } = req.params;
        await deleteOrder(id);

        res.status(StatusCodes.OK).json({
            message: "Order berhasil dihapus.",
        });
    } catch (error) {
        next(error);
    }
};

// --- 7. Update Payment Status (Admin Only) ---
const updatePaymentStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { statusPembayaran } = req.body;

        // Validate status
        const validStatuses = ['Unpaid', 'Paid', 'Pending', 'Failed'];
        if (!validStatuses.includes(statusPembayaran)) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                message: `Status pembayaran tidak valid. Pilihan: ${validStatuses.join(', ')}`
            });
        }

        const Order = require('../../../api/v1/order/model');
        const Product = require('../../../api/v1/product/model');

        // Get order
        const order = await Order.findOne({
            where: { idOrder: id },
            include: {
                model: Product,
                as: 'product',
                attributes: ['jenisProduk']
            }
        });

        if (!order) {
            return res.status(StatusCodes.NOT_FOUND).json({
                message: 'Order tidak ditemukan'
            });
        }

        // Update status
        const updateData = { statusPembayaran };
        if (statusPembayaran === 'Paid' && !order.paidAt) {
            updateData.paidAt = new Date();
        }

        await order.update(updateData);

        // Auto-unlock materi if payment changed to Paid and product is Materi
        if (statusPembayaran === 'Paid' && order.product?.jenisProduk === 'Materi') {
            const AksesMateriService = require('../../../services/mysql/aksesMateri');

            try {
                await AksesMateriService.grantAccess({
                    body: {
                        idSiswa: order.idUser,
                        idProduk: order.idProduk,
                        idOrder: order.idOrder
                    }
                });
            } catch (accessError) {
                console.error('Error auto-granting access:', accessError.message);
                // Continue even if access grant fails
            }
        }

        res.status(StatusCodes.OK).json({
            message: 'Status pembayaran berhasil diupdate',
            data: order
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    create,
    index,
    find,
    update,
    cancel,
    confirmPayment,
    destroy,
    updatePaymentStatus,
};
