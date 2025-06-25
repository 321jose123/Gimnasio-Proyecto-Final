const cron = require('node-cron');
const axios = require('axios');
const { START_SYNC, TIME_SYNC } = require('../../../config');
const { restartUserDailyAccess, getUsersWithTwoDailyAccessesForActivation } = require('../../models/users/user.model');
const { updateUserTimeAccessInDevice } = require('../../services/userServices/buildUserDevice');
const { updateUserStatus } = require('../../models/users/userStatus.model');

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

                if (response.status === 200) {
                    console.log('Eventos sincronizados correctamente.');
                }
            } catch (error) {
                console.error(`Error en la ejecución de la petición: ${error.message} - Código de error: ${error.code || 'N/A'} - Respuesta del servidor: ${error.response?.data || 'N/A'}`);
            }
        });

        // Nuevo cron job para renovar accesos diarios a las 11:00 PM
        cron.schedule('0 23 * * *', async () => {
            try {
                // Actualizar todos los usuarios activos a 2 accesos diarios
                const result = await restartUserDailyAccess();

                const usersToActivate = await getUsersWithTwoDailyAccessesForActivation();
                for (const user of usersToActivate) {
                    console.log(`Activando usuario: ${user.employee_no} (${user.name})`);

                    // Utilizar la función de activación de tiempo de acceso
                    console.log(`Intentando actualizar acceso del usuario ${user.employee_no} a: ${user.valid_begin_time} - ${user.valid_end_time}`);
                    const createUserResponse = await updateUserTimeAccessInDevice(
                        user.employee_no,
                        user.valid_begin_time,
                        user.valid_end_time
                    );
                    console.log(`Respuesta de actualización de acceso del usuario ${user.employee_no}:`, createUserResponse);

                    if (createUserResponse && !createUserResponse.error) {
                        // Actualizar el estado del usuario a activo en la base de datos
                        const updatedUser = await updateUserStatus(user.employee_no, true);
                        console.log(`Usuario ${user.employee_no} activado correctamente.`);
                    } else {
                        console.error(`Error al activar usuario ${user.employee_no}:`,
                            createUserResponse?.error || 'Error desconocido');
                    }
                }

                console.log(`Proceso de renovación y activación completado. ${usersToActivate.length} usuarios procesados.`);
            } catch (error) {
                console.error(`Error en proceso de renovación y activación: ${error.message}`);
            }
        });

    } catch (error) {
        console.error("Error en la configuración del scheduler:", error.message);
    }

    console.log("Scheduler iniciado correctamente.");
};

module.exports = { startEventScheduler };