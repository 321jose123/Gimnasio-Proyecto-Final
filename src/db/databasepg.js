const { Client } = require('pg');
const { db_host, db_port, db_user, db_password, db_database } = require('../../config');

const client = new Client({
    host: db_host,
    port: db_port,
    user: db_user,
    password: db_password,
    database: db_database,
});

client.connect().then(() => {
    console.log('Conectado a la base de datos Postgres');
}).catch(err => {
    console.error('Error al conectarse a la base de datos Postgres:', err);
    process.exit(1);
});