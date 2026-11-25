// eh-backend/src/config/db.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432,
    max: 20, // Maksimal koneksi aktif dalam satu waktu
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Menangkap error tak terduga pada koneksi yang sedang menganggur
pool.on('error', (err) => {
    console.error('❌ Error tak terduga pada klien PostgreSQL:', err.message);
});

// Tes koneksi saat aplikasi pertama kali dijalankan
pool.query('SELECT NOW()', (err, res) => {
    if (err) {
        console.error('❌ Gagal koneksi ke PostgreSQL:', err.message);
    } else {
        console.log('✅ Sukses terhubung ke PostgreSQL (equally_healthy) pada:', res.rows[0].now);
    }
});

module.exports = pool;