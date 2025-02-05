const { formatToUTC } = require("../../helpers/validate.helpers");

const buildUserObjects = (data) => {
  const {
    employeeNo,
    name,
    userType,
    Valid,
    doorRight,
    localUIUserType,
    checkUser,
    terminalNoList,
    addUser,
    gender,
    email,
    phoneNumber,
    address,
    city,
    state,
    postalCode,
    country,
    dateOfBirth,
    active = true
  } = data;

  const { beginTime, endTime } = Valid || {};

  const userData = {
    employeeNo,
    name,
    userType: userType || "normal",
    doorRight: doorRight || "1",
    Valid: {
      enable: true,
      beginTime: formatToUTC(beginTime),
      endTime: formatToUTC(endTime),
    },
    RightPlan: [
      {
        doorNo: 1,
        planTemplateNo: "1",
      },
    ],
    localUIUserType: localUIUserType || "admin",
    userVerifyMode: "faceOrFpOrCardOrPw",
    checkUser: checkUser || true,
    terminalNoList: terminalNoList || [1],
    addUser: addUser || true,
    gender,
    email,
    phoneNumber,
    address,
    city,
    state,
    postalCode,
    country,
    dateOfBirth: formatToUTC(dateOfBirth),
    active
  };

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
          doorNo: 1,
          planTemplateNo: "1",
        },
      ],
      localUIUserType: localUIUserType || "admin",
      userVerifyMode: "faceOrFpOrCardOrPw",
      checkUser: true,
      terminalNoList: [1],
      addUser: addUser || true,
    },
  };

  return { userData, jsonData };
};

module.exports = { buildUserObjects };
