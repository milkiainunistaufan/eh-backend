const express = require('express');
const router = express.Router();

const { getAllOfficers, updateOfficer } = require('../controllers/officerController');
const { verifikasiToken, hanyaAdmin } = require('../middlewares/authMiddleware');

/**
 * @swagger
 * /api/officers:
 *   get:
 *     summary: Menampilkan seluruh daftar petugas beserta username dan role
 *     tags: [Officers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Berhasil mengambil data petugas
 */
router.get('/', verifikasiToken, hanyaAdmin, getAllOfficers);

/**
 * @swagger
 * /api/officers/{id}:
 *   put:
 *     summary: Mengedit data petugas, username, role, atau reset password
 *     tags: [Officers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID Officer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               username:
 *                 type: string
 *               role:
 *                 type: string
 *               nik:
 *                 type: string
 *               specialization:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Data petugas berhasil diperbarui
 */
router.put('/:id', verifikasiToken, hanyaAdmin, updateOfficer);

module.exports = router;