// eh-backend/seed.js
require('dotenv').config();
const bcrypt = require('bcrypt');
const pool = require('./src/config/db');

async function seedAdmin() {
    const username = process.env.ADMIN_USERNAME || 'eh-admin';
    const passwordPolos = process.env.ADMIN_PASSWORD;

    if (!passwordPolos) {
        console.error('❌ Error: ADMIN_PASSWORD belum diatur di file .env!');
        process.exit(1);
    }

    const client = await pool.connect();

    try {
        console.log('Sedang memeriksa apakah user admin sudah ada...');
        await client.query('BEGIN');

        // 1. Cek apakah username sudah terdaftar
        const checkUser = await client.query('SELECT id FROM users WHERE username = $1', [username]);
        
        if (checkUser.rows.length > 0) {
            console.log('⚠️ User admin sudah ada di database.');
            await client.query('ROLLBACK');
            return;
        }

        // 2. Hash password menggunakan bcrypt (salt rounds 12)
        const passwordHash = await bcrypt.hash(passwordPolos, 12);
        const role = 'admin';

        // 3. Masukkan ke tabel users
        const insertUser = await client.query(
            'INSERT INTO users (username, password, role) VALUES ($1, $2, $3) RETURNING id',
            [username, passwordHash, role]
        );

        const userId = insertUser.rows.id;
        console.log(`✅ Sukses membuat user admin dengan ID: ${userId}`);

        // 4. Masukkan data ke tabel officers sebagai profil admin
        await client.query(
            `INSERT INTO officers (user_id, employee_id, name, is_active) 
             VALUES ($1, $2, $3, $4)`,
            [userId, 'EMP-ADMIN-001', 'Administrator SIMRS', true]
        );

        await client.query('COMMIT');
        console.log('✅ Sukses melengkapi data profil officer untuk Admin.');

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('❌ Gagal menjalankan seeder:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

seedAdmin();