require('dotenv').config(); // Memuat variabel rahasia dari file .env
const swaggerUi = require('swagger-ui-express');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const pool = require('./src/config/db'); // Mengimpor konfigurasi koneksi database
const authRoutes = require('./src/routes/authRoutes');
const officerRoutes = require('./src/routes/officerRoutes');
const swaggerSpec = require('./src/config/swager');

const app = express();
const PORT = process.env.PORT || 5000;

// 1. Mengamankan HTTP Headers
app.use(helmet());

// 2. Membatasi akses CORS hanya untuk domain frontend SIMRS Anda
const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true
};
app.use(cors(corsOptions));

// 3. Membatasi ukuran body request maksimal 10kb untuk mencegah serangan DoS
app.use(express.json({ limit: '10kb' }));

// 4. Rate limiting khusus untuk endpoint autentikasi (mencegah brute-force login)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 menit
    max: 10, // Maksimal 10 kali percobaan login per IP dalam 15 menit
    message: { message: 'Terlalu banyak percobaan login, silakan coba lagi setelah 15 menit.' }
});

// Routes
app.use('/api/auth', authLimiter, authRoutes);

app.use('/api/officers', officerRoutes);

app.get('/', (req, res) => {
    res.send('Server SIMRS Backend Berhasil Berjalan!');
});

// 5. Global Error Handler agar detail error internal tidak bocor ke publik
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Terjadi kesalahan pada server internal.' });
});

if (process.env.NODE_ENV !== 'production') {
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}

app.listen(PORT, () => {
    console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});