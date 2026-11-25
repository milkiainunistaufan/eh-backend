// eh-backend/src/middlewares/authMiddleware.js
require('dotenv').config();
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;

// Memastikan aplikasi berhenti jika JWT_SECRET lupa diatur di .env
if (!JWT_SECRET) {
    throw new Error('FATAL ERROR: JWT_SECRET belum didefinisikan di file .env!');
}

// 1. Middleware untuk memvalidasi token JWT umum
const verifikasiToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ 
            success: false, 
            message: 'Akses ditolak, token autentikasi tidak ditemukan!' 
        });
    }

    try {
        const verified = jwt.verify(token, JWT_SECRET);
        req.user = verified; // Menyimpan payload user (id, username, role)
        next();
    } catch (err) {
        return res.status(401).json({ 
            success: false, 
            message: 'Token tidak valid atau sesi telah kedaluwarsa!' 
        });
    }
};

// 2. Middleware fleksibel untuk membatasi akses berdasarkan peran (Role-Based Access)
const izinkanRole = (...rolesDiizinkan) => {
    return (req, res, next) => {
        if (!req.user || !rolesDiizinkan.includes(req.user.role)) {
            return res.status(403).json({ 
                success: false, 
                message: 'Akses ditolak, peran Anda tidak memiliki izin untuk fitur ini!' 
            });
        }
        next();
    };
};

// Alias agar kode lama yang memakai 'hanyaAdmin' tetap berjalan tanpa error
const hanyaAdmin = izinkanRole('admin');

module.exports = { verifikasiToken, izinkanRole, hanyaAdmin };