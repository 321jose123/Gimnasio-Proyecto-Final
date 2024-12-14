const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('database');

console.info("Abrir sesión de base de datos")

db.serialize(()=>{
    db.run(
        `
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT NOT NULL,
                password TEXT NOT NULL
            );
        `

    )
})

db.close();
console.info("Cerrar sesión de base de datos")

module.exports = db;