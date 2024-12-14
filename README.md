# Inicialización del proyecto
- npm init
- module base system

# Dev dependencies
- npm i --save-dev nodemon prettier
- npm install dotenv --save
- **Nodemon** es una herramienta que ayuda a desarrollar aplicaciones basadas en Node.js al reiniciar automáticamente la aplicación cuando se detectan cambios en el directorio de trabajo. Esto es especialmente útil durante el desarrollo porque:
  - Ahorra tiempo, ya que no es necesario reiniciar manualmente la aplicación después de cada cambio.
  - Mejora la eficiencia del desarrollo al permitir ver los efectos de los cambios de código en tiempo real.
  - Facilita la detección temprana de errores al proporcionar un flujo de trabajo continuo.

- **Prettier** es una herramienta de formateo de código que ayuda a tener un estilo de código consistente en todo el proyecto. La razón por la que se incluye como dependencia de desarrollo es que no se requiere para que el proyecto funcione, pero es útil para mejorar la legibilidad del código y la experiencia del desarrollador.

- **dotenv** es una dependencia de desarrollo que nos permite manejar variables de entorno. Con esto podemos separar configuraciones de desarrollo y de producción, lo que es especialmente útil al momento de subir el proyecto a un servidor en la nube. Algunas de las ventajas de utilizar dotenv son:
  - Separar configuraciones. Podemos tener diferentes configuraciones para diferentes entornos.
  - Seguridad. Podemos tener variables de entorno como contraseñas y claves de API sin que estén hardcodeadas en el proyecto.

# Estructura de carpetas
## src
### controllers
- **Controllers** es una carpeta usada para organizar funciones y logica relacionada con el acceso de datos, manipulación de recursos, validaciones y demás.
1. Separa responsabilidades. Dividido por funciones, permite que cada archivo sea responsable de una parte especifica del negocio.
2. Seguridad. Manejo de diferentes recurosos de forma organizada, permitiendo el mantenimiento y actualización del proyecto.
3. Diseño de endpoints. Organización de los endpoints de la API, permitiendo la fácil identificación y mantenimiento de cada una de las peticiones.
### db
- **DB** es una carpeta usada para organizar funciones y logica relacionada con el acceso de datos, manipulación de recursos, validaciones y demás.
### middlewares
- **Middlewares** es una carpeta usada para organizar funciones y logica relacionada con el acceso de datos, manipulación de recursos, validaciones y demás.
### models
- **Models** esta define la estructura de la base de datos.
### routes
- **Routes** define las rutas y los endpoints de la API.
### utils
- **Utils** funciones de utilidad generales, como funciones de validación, manejo de errores, manipulación de datos, etc.