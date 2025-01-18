const { Client } = require('pg');
const { db_host, db_port, db_user, db_password, db_database } = require('../../config');

const client = new Client({
    host: db_host,
    port: db_port,
    user: db_user,
    password: db_password,
    database: db_database,
});

/**
 * Intenta conectarse a la base de datos Postgres hasta un máximo de `retries` veces,
 * esperando `delay` milisegundos entre cada intento.
 * Si se logra la conexión, se devuelve inmediatamente y se imprime un mensaje de
 * confirmación en la consola.
 * Si se agotan los intentos, se imprime un mensaje de error y se termina el proceso
 * con un código de error.
 * @param {number} [retries=5] Número de intentos de conexión
 * @param {number} [delay=5000] Tiempo en milisegundos entre cada intento
 */
const connectDB = async (retries = 5, delay = 5000) => {
    for (let i = 0; i < retries; i++) {
        try {
            await client.connect();
            console.log('Conectado a la base de datos Postgres');
            return; 
        } catch (error) {
            console.error(`Error al conectarse a la base de datos Postgres (Intento ${i + 1} de ${retries}):`, error);
            if (i < retries - 1) {
                console.log(`Reintentando conexión en ${delay / 1000} segundos...`);
                await new Promise(res => setTimeout(res, delay));
            } else {
                console.error('No se pudo establecer la conexión después de varios intentos.');
                process.exit(1); 
            }
        }
    }
};

module.exports = {client, connectDB};