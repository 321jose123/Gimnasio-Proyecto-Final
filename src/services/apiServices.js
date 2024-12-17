const axios = require('axios');
const generateDigestAuthHeader = require('../utils/digestAuth');

const apiService = {
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
          'Authorization': authHeader
        },
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

  put: async (url, username, password, jsonData = {}) => {
    try {
        const initialResponse = await axios.put(url, jsonData, {
            headers:{
                'Content-Type': 'application/json'
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
            'Content-Type': 'application/json'
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
  
    // TODO: DEMÁS METODOS
  };

module.exports = {apiService, apiServiceImage};
