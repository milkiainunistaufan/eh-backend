// src/controllers/authController.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1d';

// Fungsi 1: Logika Login
const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Username dan password wajib diisi!' });
    }

    try {
        // Mengambil kolom name dari tabel officers (o.name) melalui LEFT JOIN
        const userQuery = await pool.query(
            `SELECT u.id, u.username, u.password, u.role, o.name 
             FROM users u 
             LEFT JOIN officers o ON u.id = o.user_id 
             WHERE u.username = $1`, 
            [username.trim()]
        );

        if (userQuery.rows.length === 0) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }

        const user = userQuery.rows[0]; // Pastikan menggunakan [0]

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Username atau password salah' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            success: true,
            message: 'Login berhasil!',
            token,
            user: { id: user.id, username: user.username, role: user.role, name: user.name }
        });

    } catch (err) {
        console.error('Error Login:', err.message);
        res.status(500).json({ success: false, message: 'Terjadi kesalahan pada server.' });
    }
};

// Fungsi 2: Logika Pendaftaran Petugas Baru
const registerOfficer = async (req, res) => {
    const { 
        name, username, password, role, 
        nik, str, sip, specialization, phone_number, address 
    } = req.body; 

    if (!name || !username || !password || !nik) {
        return res.status(400).json({ 
            success: false, 
            message: 'Nama, username, password, dan NIK wajib diisi!' 
        });
    }

    if (password.length < 8) {
        return res.status(400).json({ 
            success: false, 
            message: 'Password minimal harus terdiri dari 8 karakter!' 
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const userExist = await client.query('SELECT id FROM users WHERE username = $1', [username.trim()]);
        if (userExist.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Username sudah terdaftar!' });
        }

        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const prefix = `EMP-${year}${month}-`;

        const lastEmpQuery = await client.query(
            `SELECT employee_id FROM officers 
             WHERE employee_id LIKE $1 
             ORDER BY employee_id DESC LIMIT 1 FOR UPDATE`,
            [`${prefix}%`]
        );

        let nextSerialNumber = 1;
        if (lastEmpQuery.rows.length > 0) {
            const lastEmpId = lastEmpQuery.rows[0].employee_id; // Pastikan menggunakan [0]
            const lastSerialNumber = parseInt(lastEmpId.substring(prefix.length), 10);
            nextSerialNumber = lastSerialNumber + 1;
        }

        const autoEmployeeId = `${prefix}${String(nextSerialNumber).padStart(4, '0')}`;
        const passwordHash = await bcrypt.hash(password, 12);

        // Simpan ke tabel users (tanpa kolom name)
        const insertUser = await client.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
            [username.trim(), passwordHash, role || 'Pendaftaran']
        );
        const newUserId = insertUser.rows[0].id; // Pastikan menggunakan [0]

        if (nik && nik.trim().length !== 16) {
            return res.status(400).json({ 
                success: false, 
                message: 'NIK harus terdiri dari tepat 16 digit angka!' 
            });
        }
        // Simpan ke tabel officers (kolom name masuk di sini)
        await client.query(
            `INSERT INTO officers (
                user_id, employee_id, name, nik, str, sip, specialization, phone_number, address
             ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
            [newUserId, autoEmployeeId, name.trim(), nik.trim(), str || null, sip || null, specialization || null, phone_number || null, address || null]
        );

        await client.query('COMMIT');

        res.status(201).json({ 
            success: true, 
            message: `Petugas bernama ${name} berhasil didaftarkan dengan ID Karyawan: ${autoEmployeeId}` 
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error Register Officer:', err.message);
        
        if (err.code === '23505') {
            return res.status(400).json({ success: false, message: 'Data NIK atau STR sudah terdaftar di sistem.' });
        }
        
        res.status(500).json({ success: false, message: 'Gagal mendaftarkan petugas baru.' });
    } finally {
        client.release();
    }
};

module.exports = { login, registerOfficer };