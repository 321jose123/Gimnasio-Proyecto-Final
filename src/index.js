require('dotenv').config(); // <-- ESENCIAL: siempre al inicio

const express = require('express');
const cors = require('cors');
const os = require('os');
const path = require('path'); // <-- REQUERIDO PARA path.join
const { connectDB } = require('./db/databasepg');

// --- IMPORTACIONES ---
const mainRouter = require('./routes/user.routes');
const whatsappService = require('./services/whatsapp/whatsappService');
const { showDirectoryTreeIfEnabled } = require('./controllers/showDirectoryTreeIfEnabled');
const { startEventScheduler } = require('./controllers/events/eventsScheduler');

const app = express();

// --- CONFIGURACIÓN DE MIDDLEWARES ---
// 1. CORS (permite peticiones desde cualquier origen, útil en desarrollo)
app.use(cors());

// 2. Parsers de JSON y URL encoded
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));

// --- LÓGICA DE LA APLICACIÓN ---
// Mostrar estructura de directorio si está habilitado
showDirectoryTreeIfEnabled(__dirname);

// Inicialización del puerto
const port = process.env.PORT || 3000;

// Conexión a la base de datos
connectDB();

// Inicializar el cliente de WhatsApp
whatsappService.initialize().catch(err => {
  console.error("Error fatal durante la inicialización de WhatsApp. La aplicación continuará sin este servicio.", err);
});

// Iniciar sincronizador de eventos
startEventScheduler();

// Registrar rutas principales
app.use('/api', mainRouter);

// --- SERVIR EL FRONTEND ---
// Sirve la aplicación de frontend (React) desde la carpeta 'build'
// Esta es la línea corregida según tu estructura de carpetas:
app.use(express.static(path.join(__dirname, "../build")));

// Nota: Si usas React Router, necesitarás un "catch-all" adicional
// para manejar las rutas del lado del cliente:
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
  } else {
    // Si es una ruta /api no encontrada, envía un 404
    res.status(404).send('Ruta API no encontrada');
  }
});


// --- OBTENER IP LOCAL (para mostrar enlace LAN) ---
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name in interfaces) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Escuchar en todas las interfaces
app.listen(port, '0.0.0.0', () => {
  const localIP = getLocalIP();
  console.info(`✅ Servidor escuchando en el puerto ${port}`);
  console.info(`💻 Accede localmente:    http://localhost:${port}`);
  console.info(`📡 Accede desde la red: http://${localIP}:${port}`);
});