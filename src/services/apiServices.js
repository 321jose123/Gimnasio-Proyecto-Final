const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const generateDigestAuthHeader = require('../utils/digestAuth');

const apiService = {
  get: async (url, username, password, params = {}, config = {}) => {
    try {
        console.log("GET", url, username, password, params);

        const initialResponse = await axios.get(url, { params, validateStatus: false });

        if (initialResponse.status !== 401 || !initialResponse.headers['www-authenticate']) {
            console.error('Respuesta inicial:', initialResponse.status, initialResponse.headers);
            throw new Error('Failed to retrieve www-authenticate header');
        }

        const authHeader = generateDigestAuthHeader('GET', url, username, password, initialResponse.headers['www-authenticate']);

        const response = await axios({
            method: 'get',
            url,
            params,
            headers: {
                ...config.headers,
                'Authorization': authHeader,
            },
            data: config.data, 
            responseType: config.responseType || 'json', 
        });

        return response.data;
    } catch (error) {
        console.error('Error en GET:', error);
        throw error;
    }
},


  // TODO: DEMÁS METODOS
  post: async (url, username, password, dataParse, contentType = {}) => {

    console.log("POST", url, username, password, dataParse, contentType);

    try {
        const initialResponse = await axios.post(url, dataParse, {
            headers:{
                'Content-Type': contentType || 'application/json'
            },
            validateStatus: false
        });
  
        if (initialResponse.status !== 401 || !initialResponse.headers['www-authenticate']) {
          throw new Error('Failed to retrieve www-authenticate header');
        }
  
        const authHeader = generateDigestAuthHeader('POST', url, username, password, initialResponse.headers['www-authenticate']);
        
        const response = await axios.post(url, dataParse, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': contentType
          },
        });
  
        return response.data;
      } catch (error) {
        console.error('Error en POST:', error);
        throw error;
      }
  },

  put: async (url, username, password, jsonData, contentType = {}) => {
    try {
        const initialResponse = await axios.put(url, jsonData, {
            headers:{
                'Content-Type': contentType
            },
            validateStatus: false
        });
  
        if (initialResponse.status !== 401 || !initialResponse.headers['www-authenticate']) {
          throw new Error('Failed to retrieve www-authenticate header');
        }
  
        const authHeader = generateDigestAuthHeader('PUT', url, username, password, initialResponse.headers['www-authenticate']);
        
        const response = await axios.put(url, jsonData, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': contentType
          },
        });
  
        return response.data;
      } catch (error) {
        console.error('Error en PUT:', error);
        throw error;
      }
  },

  delete: async (url, username, password, jsonData = {}) => {
    try {
        const initialResponse = await axios.delete(url, {
            data: jsonData,
            headers:{
                'Content-Type': 'application/json'
            },
            validateStatus: false
        });
  
        if (initialResponse.status !== 401 || !initialResponse.headers['www-authenticate']) {
          throw new Error('Failed to retrieve www-authenticate header');
        }
  
        const authHeader = generateDigestAuthHeader('DELETE', url, username, password, initialResponse.headers['www-authenticate']);
        
        const response = await axios.delete(url, {
          data: jsonData,
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/json'
          },
        });
  
        return response.data;
      } catch (error) {
        console.error('Error en DELETE:', error);
        throw error;
      }
  },
};

const apiServiceImage = {
    get: async (url, username, password, params = {}) => {
      try {
        const initialResponse = await axios.get(url, { params, validateStatus: false });
  
        if (initialResponse.status !== 401 || !initialResponse.headers['www-authenticate']) {
          throw new Error('Failed to retrieve www-authenticate header');
        }
  
        const authHeader = generateDigestAuthHeader('GET', url, username, password, initialResponse.headers['www-authenticate']);
        
        const response = await axios.get(url, {
          params,
          headers: {
            'Authorization': authHeader,
          },
          responseType: 'ArrayBuffer'
        });
  
        return response.data;
      } catch (error) {
        console.error('Error en GET:', error);
        throw error;
      }
    },
  
      post: async (url, username, password, formDataFaceData, formDataImagePath, params = {}) => {
    console.log("POST", url, username, password, 'formdata', formDataFaceData, 'imagen',formDataImagePath);

    try {
      // Crear el objeto FormData
      const formData = new FormData();
      formData.append('FaceDataRecord', formDataFaceData);
      formData.append('img', fs.createReadStream(formDataImagePath));

      // Realizar la solicitud inicial para obtener el encabezado www-authenticate
      const initialResponse = await axios.get(url, { params, validateStatus: false });

      if (!initialResponse.headers['www-authenticate']) {
        console.error('www-authenticate header missing:', initialResponse.headers);
        throw new Error('Failed to retrieve www-authenticate header');
      }
      

      // Generar el encabezado de autenticación digest
      const authHeader = generateDigestAuthHeader('PUT', url, username, password, initialResponse.headers['www-authenticate']);

      // Realizar la solicitud POST con el encabezado de autenticación
      const response = await axios.put(url, formData, {
        headers: {
          'Authorization': authHeader,
        },
      });

      return response.data;
    } catch (error) {
      console.error('Error en POST:', error);
      throw error;
    }
  }
    };

module.exports = {apiService, apiServiceImage};
