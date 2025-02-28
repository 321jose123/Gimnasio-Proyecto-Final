const { findUserInDevice } = require('../../services/userServices/findUserInDevice');
const { searchUserByEmployeeNo } = require('../../models/users/users.models')

  /**
   * @function searchUser
   * @description Busca un usuario en la base de datos y en el dispositivo.
   * @param {Object} req - Request object.
   * @param {Object} res - Response object.
   * @returns {Promise<response>} - Response object.
   * @throws {Error} - If there is an error finding the user.
   * @example
   * const response = await searchUser(req, res);
   * console.log(response);
   * 
   */
const searchUser = async (req, res) => {
    try {
      const { EmployeeNoList = [], fuzzySearch = "" } = req.body;
  
      if (!Array.isArray(EmployeeNoList) || EmployeeNoList.length === 0) {
        return res.status(400).json({
          success: false,
          message: "Debe proporcionar al menos un número de empleado en EmployeeNoList.",
          data: null,
        });
      }
  
      const firstEmployeeNo = EmployeeNoList[0];
      let userFromDB;
      try {
        userFromDB = await searchUserByEmployeeNo(firstEmployeeNo);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error al buscar el usuario en la base de datos.",
          error: error.message,
        });
      }
  
      if (userFromDB) {
        return res.status(200).json({
          success: true,
          message: "Usuario encontrado en la base de datos.",
          source: "database",
          data: userFromDB,
        });
      }
  
      let userFromDevice;
      try {
        userFromDevice = await findUserInDevice(EmployeeNoList, fuzzySearch);
      } catch (error) {
        return res.status(500).json({
          success: false,
          message: "Error al buscar el usuario en el dispositivo.",
          error: error.message,
        });
      }
  
      return res.status(200).json({
        success: true,
        message: "Usuario encontrado en el dispositivo.",
        source: "device",
        data: userFromDevice,
      });
    } catch (err) {
      console.error("Error en searchUser:", err);
      return res.status(500).json({
        success: false,
        message: "Error al buscar usuario.",
        error: err.message,
      });
    }
  };

  module.exports = { searchUser };