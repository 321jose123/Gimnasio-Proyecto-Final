const express = require('express');
const cors = require('cors');
const userRoutes = require('./routes/user.routes');
const { connectDB } = require('./db/databasepg');
const app = express();

//TODO: CAMBIAR CORS EN PRODUCTION
const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
};

//Mostrar estructura de directorio
const directoryPath = __dirname;
const { showDirectoryTreeIfEnabled } = require('./controllers/showDirectoryTreeIfEnabled');
showDirectoryTreeIfEnabled(directoryPath);

//Middleware para leer body de request y limitarlo
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

//Uso de cors
app.use(cors(corsOptions));

//Inicialización de puerto del servidor
const port = process.env.PORT || 3000;

//Iniciar conexión a la base de datos
connectDB();

//Rutas
app.use('/api', userRoutes)

//Escuchar el puerto y iniciar el servidor
app.listen(port, () => {
  console.info(`Servidor escuchando en el puerto ${port}`);
  console.info(`http://localhost:${port}`);
});

