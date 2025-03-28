const cron = require('node-cron');
const axios = require('axios');
const { START_SYNC, TIME_SYNC } = require('../../../config');

const timeSync = TIME_SYNC;

const startEventScheduler = () => {

    try {
        if (!START_SYNC || !START_SYNC) {
            console.warn("La sincronización no está habilitada. Por favor, configure START_SYNC y TIME_SYNC en el archivo config.js.");
            return;
        }

        cron.schedule(`*/${timeSync} * * * * *`, async () => {
            try {
                const response = await axios.post('http://localhost:3000/api/events/userEvents');
            } catch (error) {
                console.error(`❌ Error en la ejecución de la petición: ${error.message} - Código de error: ${error.code || 'N/A'} - Respuesta del servidor: ${error.response?.data || 'N/A'}`);
            }
        });
        
    } catch (error) {
        console.error("❌ Error en la configuración del scheduler:", error.message);
    }

    console.log("✅ Scheduler iniciado correctamente.");
};

module.exports = { startEventScheduler };
