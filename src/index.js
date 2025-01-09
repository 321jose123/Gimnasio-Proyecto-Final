const dotenv = require('dotenv');
const express = require('express');
const cors = require('cors');

const corsOptions = {
    origin: '*',  
    methods: 'GET,POST,PUT,DELETE', 
    allowedHeaders: 'Content-Type, Authorization' 
  };

  
  
  const directoryPath = __dirname;
  const {showDirectoryTreeIfEnabled}  = require('./controllers/showDirectoryTreeIfEnabled');
  const userRoutes = require('./routes/user.routes');
  
  showDirectoryTreeIfEnabled(directoryPath);
  
  const app = express();
  app.use(cors(corsOptions));
  const port = process.env.PORT || 3000;
  app.use(express.json());
  
  app.use(express.static('public'));

app.use('/api', userRoutes)
app.listen(port, ()=>{
    console.info(`Servidor escuchando en el puerto ${port}`);
    console.info(`http://localhost:${port}`);
});

