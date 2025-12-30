const Order = require('../../api/v1/order/model');
const Users = require('../../api/v1/users/model');
const Product = require('../../api/v1/product/model');
const OrderFormResponse = require('../../api/v1/orderFormResponses/model');
const FormField = require('../../api/v1/formFields/model');
const { NotFoundError, BadRequestError, UnauthenticatedError } = require('../../errors');

// Helper untuk validasi User
const checkingUser = async (idUser) => {
    const checkUser = await Users.findOne({
        where: { idUser },
    });

    if (!checkUser) {
        throw new NotFoundError(`ID User: ${idUser} tidak ditemukan.`);
    }
    return checkUser;
};

// Helper untuk validasi Product
const checkingProduct = async (idProduk) => {
    const checkProduct = await Product.findOne({
        where: { idProduk },
    });

    if (!checkProduct) {
        throw new NotFoundError(`ID Produk: ${idProduk} tidak ditemukan.`);
    }
    return checkProduct;
};

// Include configuration untuk relasi
const orderIncludes = [
    {
        model: Users,
        as: 'user',
        attributes: ['idUser', 'email', 'namaLengkap'],
        required: false, // LEFT JOIN (user bisa null jika dihapus)
    },
    {
        model: Product,
        as: 'product',
        attributes: ['idProduk', 'namaProduk', 'hargaJual', 'kategoriHarga', 'jenisProduk'],
        required: false, // LEFT JOIN (product bisa null jika dihapus)
    }
];

// --- 1. CREATE ORDER (create) ---
const createOrder = async (req) => {
    const { idUser, idProduk, jumlahBeli, diskon, formResponses } = req.body;

    // 1. Validasi Input
    if (!idUser || !idProduk) {
        throw new BadRequestError('ID User dan ID Produk wajib diisi.');
    }

    if (!formResponses || !Array.isArray(formResponses) || formResponses.length === 0) {
        throw new BadRequestError('Form responses wajib diisi.');
    }

    // 2. Cek keberadaan User
    const user = await checkingUser(idUser);

    // 3. Cek keberadaan Product
    const product = await checkingProduct(idProduk);

    // 4. Extract data pembeli dari form responses
    const namaField = formResponses.find(r => r.namaField === 'nama_lengkap');
    const emailField = formResponses.find(r => r.namaField === 'email');
    const hpField = formResponses.find(r => r.namaField === 'nomor_telepon' || r.namaField === 'no_hp');

    if (!namaField || !emailField || !hpField) {
        throw new BadRequestError('Form harus memiliki field: nama_lengkap, email, dan nomor_telepon');
    }

    // 5. Hitung harga
    const qty = jumlahBeli || 1;
    const hargaTransaksi = product.hargaJual * qty;
    const diskonAmount = diskon || 0;
    const hargaFinal = hargaTransaksi - diskonAmount;

    // 6. Buat Order dengan SNAPSHOT
    const newOrder = await Order.create({
        // Foreign Keys
        idUser,
        idProduk,

        // Snapshot Produk
        namaProduk: product.namaProduk,
        hargaProduk: product.hargaJual,

        // Snapshot Pembeli (dari form)
        namaPembeli: namaField.nilaiJawaban,
        emailPembeli: emailField.nilaiJawaban,
        noHpPembeli: hpField.nilaiJawaban,

        // Data Transaksi
        jumlahBeli: qty,
        hargaTransaksi,
        diskon: diskonAmount,
        hargaFinal,

        // Status
        statusOrder: 'Pending',
        statusPembayaran: 'Unpaid',

        // Timestamps
        tglOrder: new Date(),
    });

    // 7. Simpan Form Responses
    const responsesData = formResponses.map((response) => ({
        idOrder: newOrder.idOrder,
        idField: response.idField,
        nilaiJawaban: response.nilaiJawaban,
    }));

    await OrderFormResponse.bulkCreate(responsesData);

    // 8. Ambil data order lengkap dengan relasi
    const result = await Order.findOne({
        where: { idOrder: newOrder.idOrder },
        include: orderIncludes,
    });

    return result;
};

// --- 2. GET ALL ORDERS (readAll) ---
const getAllOrders = async (req) => {
    const { idUser, statusOrder, statusPembayaran } = req.query;

    let whereClause = {};

    if (idUser) {
        whereClause.idUser = idUser;
    }

    if (statusOrder) {
        whereClause.statusOrder = statusOrder;
    }

    if (statusPembayaran) {
        whereClause.statusPembayaran = statusPembayaran;
    }

    const result = await Order.findAll({
        where: whereClause,
        include: orderIncludes,
        order: [['tglOrder', 'DESC']],
    });

    return result;
};

// --- 3. GET ONE ORDER (readOne) ---
const getOrderDetail = async (idOrder) => {
    const result = await Order.findOne({
        where: { idOrder },
        include: orderIncludes,
    });

    if (!result) {
        throw new NotFoundError(`Order dengan ID: ${idOrder} tidak ditemukan.`);
    }

    return result;
};

// --- 4. UPDATE ORDER STATUS (update) ---
const updateOrderStatus = async (idOrder, data) => {
    const { statusOrder, statusPembayaran, midtransTransactionId, paymentMethod } = data;

    // 1. Cek keberadaan Order
    const checkOrder = await Order.findOne({ where: { idOrder } });
    if (!checkOrder) {
        throw new NotFoundError(`Order dengan ID: ${idOrder} tidak ditemukan.`);
    }

    // 2. Validasi status order
    const validOrderStatuses = ['Pending', 'Confirmed', 'Processing', 'Completed', 'Cancelled'];
    if (statusOrder && !validOrderStatuses.includes(statusOrder)) {
        throw new BadRequestError(`Status Order tidak valid. Pilihan: ${validOrderStatuses.join(', ')}`);
    }

    // 3. Validasi status pembayaran
    const validPaymentStatuses = ['Unpaid', 'Paid', 'Refunded', 'Failed'];
    if (statusPembayaran && !validPaymentStatuses.includes(statusPembayaran)) {
        throw new BadRequestError(`Status Pembayaran tidak valid. Pilihan: ${validPaymentStatuses.join(', ')}`);
    }

    // 4. Update data
    const updateData = {};
    if (statusOrder) updateData.statusOrder = statusOrder;
    if (statusPembayaran) updateData.statusPembayaran = statusPembayaran;
    if (midtransTransactionId) updateData.midtransTransactionId = midtransTransactionId;
    if (paymentMethod) updateData.paymentMethod = paymentMethod;

    // Set paidAt jika pembayaran berhasil
    if (statusPembayaran === 'Paid' && !checkOrder.paidAt) {
        updateData.paidAt = new Date();
    }

    await checkOrder.update(updateData);

    // 5. Dapatkan data yang sudah di-update
    const updatedOrder = await getOrderDetail(idOrder);
    return updatedOrder;
};

// --- 5. CANCEL ORDER (cancel) ---
const cancelOrder = async (req) => {
    const { id } = req.params;
    const { idUser } = req.user; // Dari JWT middleware

    // 1. Cek keberadaan Order
    const order = await Order.findOne({ where: { idOrder: id } });

    if (!order) {
        throw new NotFoundError(`Order dengan ID: ${id} tidak ditemukan.`);
    }

    // 2. Cek apakah user adalah pemilik order
    if (order.idUser !== idUser) {
        throw new UnauthenticatedError('Anda tidak memiliki akses untuk membatalkan order ini.');
    }

    // 3. Cek apakah order masih bisa dibatalkan
    if (order.statusOrder === 'Completed') {
        throw new BadRequestError('Order yang sudah selesai tidak bisa dibatalkan.');
    }

    if (order.statusOrder === 'Cancelled') {
        throw new BadRequestError('Order sudah dibatalkan sebelumnya.');
    }

    // 4. Update status menjadi Cancelled
    await order.update({
        statusOrder: 'Cancelled',
        statusPembayaran: order.statusPembayaran === 'Paid' ? 'Refunded' : 'Failed'
    });

    return order;
};

// --- 6. DELETE ORDER (destroy) - Hanya untuk Admin ---
const deleteOrder = async (idOrder) => {
    const result = await Order.findOne({
        where: { idOrder },
    });

    if (!result) {
        throw new NotFoundError(`Order dengan ID: ${idOrder} tidak ditemukan.`);
    }

    // Hapus order (cascade akan menghapus OrderFormResponse terkait)
    await result.destroy();

    return result;
};

// EXPORT SEMUA FUNGSI
module.exports = {
    createOrder,
    getAllOrders,
    getOrderDetail,
    updateOrderStatus,
    cancelOrder,
    deleteOrder,
};
