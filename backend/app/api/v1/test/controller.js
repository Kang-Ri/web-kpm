const { StatusCodes } = require('http-status-codes');
const Order = require('../../api/v1/order/model');
const Product = require('../../api/v1/product/model');

/**
 * POST /api/v1/test/create-dummy-order
 * Create a dummy unpaid order for testing payment
 */
const createDummyOrder = async (req, res, next) => {
    try {
        // Find a product or create a dummy one
        let product = await Product.findOne({ where: { namaProduk: 'Test Product - Payment Simulator' } });

        if (!product) {
            // Get any parentProduct2 or use ID 1
            product = await Product.create({
                idParent2: 1, // Adjust if needed
                namaProduk: 'Test Product - Payment Simulator',
                descProduk: 'Produk dummy untuk testing payment',
                kategoriHarga: 'Bernominal',
                hargaJual: 100000,
                jenisProduk: 'Materi',
                authProduk: 'Umum',
                statusProduk: 'Publish'
            });
        }

        // Create dummy order
        const dummyOrder = await Order.create({
            idUser: req.body.idUser || 1, // Use provided or default
            idProduk: product.idProduk,
            namaProduk: product.namaProduk,
            hargaProduk: product.hargaJual,
            namaPembeli: req.body.namaPembeli || 'Test User',
            emailPembeli: req.body.emailPembeli || 'test@example.com',
            noHpPembeli: req.body.noHpPembeli || '081234567890',
            jumlahBeli: 1,
            hargaTransaksi: product.hargaJual,
            diskon: 0,
            hargaFinal: product.hargaJual,
            statusOrder: 'Pending',
            statusPembayaran: 'Unpaid',
            tglOrder: new Date()
        });

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Dummy order created for testing',
            data: dummyOrder
        });
    } catch (error) {
        console.error('Error creating dummy order:', error);
        next(error);
    }
};

/**
 * DELETE /api/v1/test/cleanup-dummy-orders
 * Delete all test orders
 */
const cleanupDummyOrders = async (req, res, next) => {
    try {
        const deleted = await Order.destroy({
            where: {
                namaProduk: 'Test Product - Payment Simulator'
            }
        });

        res.json({
            success: true,
            message: `Deleted ${deleted} test orders`,
            count: deleted
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createDummyOrder,
    cleanupDummyOrders
};
