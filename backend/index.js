const express = require('express');
const cors = require('cors');
require('dotenv').config();
const sequelize = require('./config/database');

const personalRoutes = require('./routes/personal');
const areaRoutes = require('./routes/areas');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas
app.use('/api/personal', personalRoutes);
app.use('/api/areas', areaRoutes);

// Probar conexión y arrancar servidor
async function startServer() {
    try {
        await sequelize.authenticate();
        console.log('--- Conexión a la base de datos establecida correctamente. ---');

        // Sincronizar modelos (no usar force: true en producción)
        await sequelize.sync();

        app.listen(PORT, () => {
            console.log(`--- Servidor Node.js corriendo en el puerto ${PORT} ---`);
        });
    } catch (error) {
        console.error('--- No se pudo conectar a la base de datos: ---', error);
    }
}

startServer();
