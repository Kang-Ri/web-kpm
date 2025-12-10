// app/services/email/index.js (sesuai struktur folder Anda)

const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
dotenv.config();

// Inisiasi Transporter (Ganti dengan detail provider email Anda)
// Pastikan variabel ENV sudah diatur (EMAIL_HOST, EMAIL_USER, dll.)
const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

const sendEmail = async (options) => {
    // Detail pesan email
    const message = {
        from: `${process.env.EMAIL_FROM_NAME || 'KPM CMS'} <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
    };

    try {
        const info = await transporter.sendMail(message);
        console.log('✅ Email terkirim: %s', info.messageId);
        return info;
    } catch (error) {
        console.error('❌ Gagal mengirim email:', error);
        // Dalam lingkungan production, Anda mungkin ingin melempar error di sini
        // throw new Error('Gagal mengirim email.'); 
    }
};

module.exports = {
    sendEmail,
};