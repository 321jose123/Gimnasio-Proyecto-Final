# BACKEND SOFTWARE DE ACCESOS PARA DISPOSITIVOS HIKVISION

**Descripción:**
Este proyecto es un backend diseñado como software de terceros para la gestión de accesos de usuarios en plantas físicas. Se comunica con dispositivos validadores de identidad de la marca Hikvision para controlar y registrar el acceso.

## Requisitos previos

- Node.js v22.14.0 (npm v10.9.2)
- Servidor de bases de datos PostgreSQL configurado con las tablas necesarias para el almacenamiento de datos de acceso.

## Instalación

1. Eliminar las carpetas `node_modules` y el archivo `package-lock.json` si existen en el directorio del proyecto.
2. Asegurarse de estar utilizando la versión de Node.js `v22.14.0` (con npm `v10.9.2`). Puedes verificar tu versión con los comandos `node -v` y `npm -v`.
3. Instalar las dependencias del proyecto utilizando el comando:

   ```bash
   npm install
   ```

   Todas las dependencias necesarias están listadas en el archivo package.json.

4. Configurar la base de datos PostgreSQL:
   Asegúrate de tener un servidor PostgreSQL en funcionamiento y una base de datos creada para este proyecto.
   Edita el archivo config.js con la información de conexión a tu base de datos PostgreSQL en la sección //TODO: CONEXIÓN CON DATABASE CONFIG:
   ```bash
     //TODO: CONEXIÓN CON DATABASE CONFIG
    module.exports = {
      db_host: '192.168.1.xxx', // Reemplaza con la dirección IP o hostname de tu servidor PostgreSQL
      db_port: 5432,             // Puerto por defecto de PostgreSQL
      db_user: 'postgres',       // Reemplaza con el nombre de usuario de tu base de datos
      db_password: 'xxxx',       // Reemplaza con la contraseña de tu base de datos
      db_database: 'DB_xxx'      // Reemplaza con el nombre de la base de datos que creaste
    };
   ```
5. Configurar las variables de entorno en el archivo .env:
   Crea un archivo llamado .env en la raíz del proyecto.
   Agrega las siguientes variables de entorno con la información correspondiente para la conexión con los dispositivos Hikvision:
   ```bash
    API_USERNAME=admin           # Nombre de usuario para acceder a la API del dispositivo Hikvision
    API_PASSWORD=xxxxx         # Contraseña para acceder a la API del dispositivo Hikvision
    BASE_URL=http://192.168.1.xxx # URL base de la API del dispositivo Hikvision (reemplaza con la dirección IP de tu dispositivo)
    SYNC_KEY=true              # Clave de sincronización (actualmente un booleano)
   ```

## Ejecución

Para iniciar la aplicación en modo de desarrollo, utiliza el siguiente comando:

```bash
 npm start
```

## Autor

Kevin Santiago .S .O
