// src/config/swagger.js
const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Dokumentasi API - Equally Healthy (SIMRS)',
            version: '1.0.0',
            description: 'Dokumentasi interaktif RESTful API untuk Backend SIMRS Equally Healthy',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Server Pengembangan Lokal',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    // Membaca komentar dokumentasi dari seluruh file di dalam folder routes
    apis: ['./src/routes/*.js'], 
};

const swaggerSpec = swaggerJsdoc(options);
module.exports = swaggerSpec;