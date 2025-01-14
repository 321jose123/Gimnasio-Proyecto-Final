const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

const corsOptions = {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE',
  allowedHeaders: 'Content-Type, Authorization'
};


const directoryPath = __dirname;
const { showDirectoryTreeIfEnabled } = require('./controllers/showDirectoryTreeIfEnabled');
const userRoutes = require('./routes/user.routes');
const { connectDB } = require('./db/databasepg');

showDirectoryTreeIfEnabled(directoryPath);

const app = express();
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ limit: '100mb', extended: true }));


app.use(cors(corsOptions));
const port = process.env.PORT || 3000;
app.use(express.json());


app.use(express.static('public'));

connectDB();

app.use('/api', userRoutes)
app.listen(port, () => {
  console.info(`Servidor escuchando en el puerto ${port}`);
  console.info(`http://localhost:${port}`);
});

