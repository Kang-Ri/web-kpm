const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../../../errors');
const MateriButtonClick = require('./model');
const MateriButton = require('../materiButton/model');
const Siswa = require('../siswa/model');
const Product = require('../product/model');
const AksesMateri = require('../aksesMateri/model');
const { exportClicksByClassroom } = require('../../../services/mysql/materiButtonClickExport');

/**
 * TRACK Button Click
 * POST /student/materi/:idProduk/buttons/:idButton/click
 */
const trackClick = async (req, res, next) => {
    try {
        const { idButton } = req.params;
        const idSiswa = req.user?.idSiswa; // Dari auth middleware

        if (!idSiswa) {
            throw new BadRequestError('User harus login sebagai siswa');
        }

        // Get button info
        const button = await MateriButton.findByPk(idButton);
        if (!button) {
            throw new NotFoundError('Button tidak ditemukan');
        }

        // Check if student has access to this materi
        const access = await AksesMateri.findOne({
            where: {
                idSiswa,
                idProduk: button.idProduk
            }
        });

        if (!access || access.statusAkses !== 'Unlocked') {
            return res.status(StatusCodes.FORBIDDEN).json({
                message: 'Anda belum memiliki akses ke materi ini'
            });
        }

        // Track the click
        const click = await MateriButtonClick.create({
            idButton,
            idSiswa,
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.headers['user-agent']
        });

        res.status(StatusCodes.CREATED).json({
            message: 'Click tracked successfully',
            data: click
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET Button Click Logs (for Admin modal)
 * GET /cms/buttons/:idButton/clicks
 */
const getButtonClicks = async (req, res, next) => {
    try {
        const { idButton } = req.params;

        const button = await MateriButton.findByPk(idButton);
        if (!button) throw new NotFoundError('Button tidak ditemukan');

        const clicks = await MateriButtonClick.findAll({
            where: { idButton },
            include: [{
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'nisn', 'email']
            }],
            order: [['tanggalKlik', 'DESC']]
        });

        const totalClicks = clicks.length;
        const uniqueUsers = [...new Set(clicks.map(c => c.idSiswa))].length;

        res.status(StatusCodes.OK).json({
            message: 'Data klik berhasil diambil',
            data: {
                idButton: button.idButton,
                namaButton: button.namaButton,
                judulButton: button.judulButton,
                totalClicks,
                uniqueUsers,
                clicks: clicks.map(c => ({
                    idClick: c.idClick,
                    idSiswa: c.idSiswa,
                    nisn: c.siswa?.nisn || '-',
                    namaLengkap: c.siswa?.namaLengkap || 'Unknown',
                    email: c.siswa?.email || '-',
                    tanggalKlik: c.tanggalKlik,
                }))
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * GET All Clicks for a Product (Admin)
 * GET /cms/product/:idProduk/analytics
 */
const getProductAnalytics = async (req, res, next) => {
    try {
        const { idProduk } = req.params;

        // Get product with buttons
        const product = await Product.findByPk(idProduk, {
            include: [{
                model: MateriButton,
                as: 'buttons',
                include: [{
                    model: MateriButtonClick,
                    as: 'clicks',
                    include: [{
                        model: Siswa,
                        as: 'siswa',
                        attributes: ['idSiswa', 'namaLengkap', 'kelas']
                    }]
                }]
            }]
        });

        if (!product) {
            throw new NotFoundError('Product tidak ditemukan');
        }

        // Aggregate data
        let totalClicks = 0;
        const buttonStats = product.buttons.map(button => {
            const clicks = button.clicks || [];
            totalClicks += clicks.length;

            return {
                idButton: button.idButton,
                namaButton: button.namaButton,
                totalClicks: clicks.length,
                uniqueUsers: [...new Set(clicks.map(c => c.idSiswa))].length
            };
        });

        res.status(StatusCodes.OK).json({
            message: 'Product analytics retrieved successfully',
            data: {
                idProduk,
                namaProduk: product.namaProduk,
                totalButtons: product.buttons.length,
                totalClicks,
                buttonStats
            }
        });
    } catch (err) {
        next(err);
    }
};

/**
 * EXPORT Click Logs to Excel (Admin)
 * GET /cms/materi/clicks/export?idParent2=5
 */
const exportClicks = async (req, res, next) => {
    try {
        const { idParent2 } = req.query;

        if (!idParent2) {
            throw new BadRequestError('idParent2 (ID Ruang Kelas) is required');
        }

        const buffer = await exportClicksByClassroom(parseInt(idParent2));

        if (!buffer) {
            return res.status(StatusCodes.OK).json({
                message: 'Belum ada data klik untuk ruang kelas ini',
                data: null
            });
        }

        res.setHeader(
            'Content-Type',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        );
        res.setHeader(
            'Content-Disposition',
            `attachment; filename=log-klik-materi-${Date.now()}.xlsx`
        );

        res.send(buffer);
    } catch (err) {
        next(err);
    }
};

module.exports = {
    trackClick,
    getButtonClicks,
    getProductAnalytics,
    exportClicks
};
