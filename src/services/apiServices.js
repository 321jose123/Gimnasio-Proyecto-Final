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
  post: async (url, username, password, xmlData = {}) => {
    try {
        const initialResponse = await axios.post(url, xmlData, {
            headers:{
                'Content-Type': 'application/xml'
            },
            validateStatus: false
        });
  
        if (initialResponse.status !== 401 || !initialResponse.headers['www-authenticate']) {
          throw new Error('Failed to retrieve www-authenticate header');
        }
  
        const authHeader = generateDigestAuthHeader('POST', url, username, password, initialResponse.headers['www-authenticate']);
        
        const response = await axios.post(url, xmlData, {
          headers: {
            'Authorization': authHeader,
            'Content-Type': 'application/xml'
          },
        });
  
        return response.data;
      } catch (error) {
        console.error('Error en POST:', error);
        throw error;
      }
  }
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
