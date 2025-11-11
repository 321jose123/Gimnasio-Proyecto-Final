const { formatToUTC } = require("../../helpers/validate.helpers");

const buildUserObjects = (data) => {
  // 1. AÑADIMOS face_image A LA DESTRUCTURACIÓN
  const {
    employeeNo,
    name,
    doorRight,
    Valid,
    doorNo,
    planTemplateNo,
    userVerifyMode,
    gender,
    email,
    phoneNumber,
    address,
    city,
    state,
    postalCode,
    country,
    dateOfBirth,
    active = true,
    accesosDisponibles,
    groupID,
    face_image // <- Aquí está
  } = data;

  const { beginTime, endTime } = Valid || {};

  const userData = {
    employeeNo,
    name,
    userType: "normal",
    doorRight: doorRight || "1",
    Valid: {
      enable: true,
      beginTime: formatToUTC(beginTime),
      endTime: formatToUTC(endTime),
    },
    RightPlan: [
      {
        doorNo: doorNo || 1,
        planTemplateNo: planTemplateNo || "1",
      },
    ],
    localUIUserType: "admin",
    userVerifyMode: userVerifyMode || "faceOrFpOrCardOrPw",
    checkUser: true,
    terminalNoList: [1],
    addUser: true,
    gender,
    email,
    phoneNumber,
    address,
    city,
    state,
    postalCode,
    country,
    dateOfBirth: formatToUTC(dateOfBirth),
    active,
    accesosDisponibles,
    groupID: groupID || 1, 
    acc_diarios: 2,
    face_image // 2. AÑADIMOS face_image AL OBJETO PARA LA BD
  };

  // El objeto para el dispositivo no necesita la imagen, así que se mantiene igual.
  const jsonData = {
    userInfo: {
      employeeNo,
      name,
      userType: "normal",
      Valid: {
        enable: true,
        beginTime: formatToUTC(beginTime),
        endTime: formatToUTC(endTime),
      },
      doorRight: doorRight || "1",
      RightPlan: [
        {
          doorNo: doorNo || 1,
          planTemplateNo: planTemplateNo || "1",
        },
      ],
      localUIUserType: "admin",
      userVerifyMode: "faceOrFpOrCardOrPw",
      checkUser: true,
      terminalNoList: [1],
      addUser: true,
    },
  };

  return { userData, jsonData };
};

module.exports = { buildUserObjects };

