const { Client } = require('pg');
const { db_host, db_port, db_user, db_password, db_database } = require('../../config');

const client = new Client({
    host: db_host,
    port: db_port,
    user: db_user,
    password: db_password,
    database: db_database,
});

const connectDB = async () => {
    try {
        await client.connect();
        console.log('Conectado a la base de datos Postgres');
    } catch (error) {
        console.error('Error al conectarse a la base de datos Postgres:', error);
        process.exit(1);
    }
};

module.exports = {client, connectDB};