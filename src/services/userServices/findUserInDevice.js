const { apiService } = require("../apiServices");
const { API_URL_SEARCH_USER } = require("../../../config");
const { API_USERNAME, API_PASSWORD } = process.env;


const findUserInDevice = async (EmployeeNoList, fuzzySearch) => {
    const jsonData = {
        UserInfoSearchCond: {
            searchID: "UserSearchCond",
            searchResultPosition: 0,
            maxResults: 1,
            EmployeeNoList: EmployeeNoList.map((employeeNo) => ({ employeeNo })),
            fuzzySearch : fuzzySearch,
            userType: "normal",
        },
    };

    try {
        const response = await apiService.post(
            API_URL_SEARCH_USER,
            API_USERNAME,
            API_PASSWORD,
            jsonData,
            "application/json"
        );

        console.log(response);
        

        const responseStatusStrg = response.UserInfoSearch.responseStatusStrg;

        if (responseStatusStrg !== "OK") {
            throw new Error("Error en la validación del usuario");
        }

        return response;
    } catch (error) {
        console.error("Error de busqueda en el dispositivo:", error.message);
        throw new Error("No se pudo encontrar el usuario en el dispositivo");
    }
};

module.exports = { findUserInDevice };
