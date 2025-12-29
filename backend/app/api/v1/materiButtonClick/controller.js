const { StatusCodes } = require('http-status-codes');
const { BadRequestError, NotFoundError } = require('../../../errors');
const MateriButtonClick = require('./model');
const MateriButton = require('../materiButton/model');
const Siswa = require('../siswa/model');
const Product = require('../product/model');
const AksesMateri = require('../aksesMateri/model');

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
 * GET Button Analytics
 * GET /cms/product/:idProduk/buttons/:idButton/analytics
 */
const getAnalytics = async (req, res, next) => {
    try {
        const { idButton } = req.params;

        // Get all clicks for this button
        const clicks = await MateriButtonClick.findAll({
            where: { idButton },
            include: [{
                model: Siswa,
                as: 'siswa',
                attributes: ['idSiswa', 'namaLengkap', 'kelas', 'asalSekolah']
            }],
            order: [['tanggalKlik', 'DESC']]
        });

        // Calculate metrics
        const totalClicks = clicks.length;
        const uniqueUsers = [...new Set(clicks.map(c => c.idSiswa))].length;

        // Group by date
        const clicksByDate = clicks.reduce((acc, click) => {
            const date = click.tanggalKlik.toISOString().split('T')[0];
            acc[date] = (acc[date] || 0) + 1;
            return acc;
        }, {});

        // Top clickers
        const clicksByUser = clicks.reduce((acc, click) => {
            const userId = click.idSiswa;
            if (!acc[userId]) {
                acc[userId] = {
                    idSiswa: click.siswa.idSiswa,
                    namaLengkap: click.siswa.namaLengkap,
                    kelas: click.siswa.kelas,
                    clickCount: 0
                };
            }
            acc[userId].clickCount++;
            return acc;
        }, {});

        const topClickers = Object.values(clicksByUser)
            .sort((a, b) => b.clickCount - a.clickCount)
            .slice(0, 10);

        res.status(StatusCodes.OK).json({
            message: 'Analytics retrieved successfully',
            data: {
                totalClicks,
                uniqueUsers,
                clicksByDate,
                topClickers,
                recentClicks: clicks.slice(0, 20) // Last 20 clicks
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

module.exports = {
    trackClick,
    getAnalytics,
    getProductAnalytics
};
