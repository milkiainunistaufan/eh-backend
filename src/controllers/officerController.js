const bcrypt = require('bcrypt');
const pool = require('../config/db');

const getAllOfficers = async (req, res) => {
    try {
        const query = await pool.query(`
            SELECT
            o.id AS officer_id,
            o.employee_id,
            o.name,
            o.nik,
            o.str,
            o.sip,
            o.specialization,
            o.phone_number,
            o.address,
            o.is_active,
            o.satusehat_practitioner_id,
            u.id AS user_id,
            u.username,
            u.role
            from officers o 
            INNER JOIN users u ON o.user_id = u.id
            WHERE o.deleted_at IS NULL
            ORDER BY o.created_at DESC
            `);

            res.json({
                success: true,
                data: query.rows
            });
    } catch (err) {
        console.error('Error getAllOfficers:', err.message);
        res.status(500).json({ success: false, message: 'Gagal mengambil data petugas.' });
    }
};

const updateOfficer = async (req, res) => {
    const { id } = req.params;
    const { name, nik, str, sip, specialization, phone_number, address, is_active, username, role, new_password} = req.body;

    if (!name || !username || !role) {
        return res.status(400).json({
            success: false,
            message: 'Nama, username, dan role wajib diisi!'
        });
    }

    if (nik && nik.trim().length !== 16) {
        return res.status(400).json({
            success: false,
            message: 'NIK harus terdiri dari 16 digit!'
        });
    }

    if (new_password && new_password.length < 8) {
        return res.status(400).json({
            success: false,
            message: 'Password minimal harus terdiri dari 8 karakter!'
        });
    }

    const client = await pool.connect();

    try {
        await client.query('BETGIN');

        const officeCheck = await client.query(
            'SELECT user_id FROM officers WHERE id = $1 AND deleted_at IS NULL FOR UPDATE',
            [id]
        );

        if (officerCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                message: 'Data Petugas tidak ditemukan!'
            });
        }

        const userId = officerCheck.rows.user_id;

        const usernameCheck = await client.query(
            'SELECT id FROM users WHERE username = $1 AND id !=$2', [username.trim(), userId]
        );

        if (usernameCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({
                success: false,
                message: 'Username sudah digunakan oleh petugas lain!'
            });
        }

        if (new_password) {
            const passwordHash = await bcrypt.hash(new_password, 12);
            await client.query(
                'UPDATE users SET username = $1, role = $2, password = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4',
                [username.trim(), role, passwordHash, userId]
            );
        } else {
            await client.query(
                'UPDATE users SET username = $1, role = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
                [username.trim(), role, userId]
            );
        }

        await client.query(
            `UPDATE officers SET
                name = $1,
                nik = $2,
                str = $3,
                sip = $4,
                specialization = $5,
                phone_number = $6,
                address = $7,
                is_active = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9,
        `,
            [
                name.trim(),
                nik ? nik.trim() : null,
                str || null,
                sip || null,
                specialization || null,
                phone_number || null,
                address || null,
                is_active !== undefined ? is_active : true,
                id
            ]
        );

        await client.query('COMMIT');
        res.json({
            success: true,
            message: `Data petugas ${name} dan akun login berhasil diperbarui!`
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updateOfficer:', err.message);

        if (err.code === '23505'){
            return res.status(400).json({
                success: false,
                message: 'Data NIK atau STR sudah terdaftar pada petugas lain.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Gagal memperbarui data petugas.'
        });
    } finally {
        client.release();
    }
};

module.exports = { getAllOfficers, updateOfficer };