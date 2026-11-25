// src/routes/authRoutes.js
const express = require('express');
const router = express.Router();

const { login, registerOfficer } = require('../controllers/authController');
const { verifikasiToken, hanyaAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login pengguna SIMRS untuk mendapatkan Token JWT
 *     tags: [Autentikasi]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - username
 *               - password
 *             properties:
 *               username:
 *                 type: string
 *                 example: eh-admin
 *               password:
 *                 type: string
 *                 example: Tlogorejo1234
 *     responses:
 *       200:
 *         description: Login berhasil dan mengembalikan token JWT
 */
router.post('/login', login);

/**
 * @swagger
 * /api/auth/register-officer:
 *   post:
 *     summary: Mendaftarkan petugas baru beserta akun login (Khusus Admin)
 *     tags: [Autentikasi]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - username
 *               - password
 *               - nik
 *             properties:
 *               name:
 *                 type: string
 *                 example: dr. Budi Santoso, Sp.PD
 *               username:
 *                 type: string
 *                 example: dr.budi
 *               password:
 *                 type: string
 *                 example: PasswordKuat123
 *               role:
 *                 type: string
 *                 example: dokter
 *               nik:
 *                 type: string
 *                 example: "3507123456780001"
 *               str:
 *                 type: string
 *                 example: "1234567890123456"
 *               sip:
 *                 type: string
 *                 example: "503/123/SIP/2026"
 *               specialization:
 *                 type: string
 *                 example: Penyakit Dalam
 *               phone_number:
 *                 type: string
 *                 example: "081234567890"
 *               address:
 *                 type: string
 *                 example: Jl. Raya Tlogorejo No. 10, Malang
 *     responses:
 *       201:
 *         description: Petugas baru berhasil didaftarkan
 *       400:
 *         description: Data tidak lengkap atau username/NIK sudah terdaftar
 *       403:
 *         description: Akses ditolak (bukan Admin)
 */
router.post('/register-officer', verifikasiToken, hanyaAdmin, registerOfficer);

module.exports = router;