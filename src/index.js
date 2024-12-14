const dotenv = require('dotenv');
const express = require('express');
const directoryPath = __dirname;
const {showDirectoryTreeIfEnabled}  = require('./controllers/showDirectoryTreeIfEnabled');
const userRoutes = require('./routes/user.routes');

showDirectoryTreeIfEnabled(directoryPath);

const app = express();
const port = process.env.PORT || 3000;

app.use('/api', userRoutes)
app.listen(port, ()=>{
    console.info(`Servidor escuchando en el puerto ${port}`);
    console.info(`http://localhost:${port}`);
});

