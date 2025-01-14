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
    userVerifyMode,
    RightPlan,
  } = data;

  const { beginTime, endTime } = Valid || {};
  const [{ doorNo, planTemplateNo } = {}] = RightPlan || [];

  const beginTimeUTC = formatToUTC(beginTime);
  const endTimeUTC = formatToUTC(endTime);

  const userData = {
    employeeNo,
    name,
    userType,
    doorRight,
    Valid: {
      enable: true,
      beginTime: beginTimeUTC,
      endTime: endTimeUTC,
    },
    RightPlan: [{ doorNo, planTemplateNo }],
    localUIUserType,
    userVerifyMode,
    checkUser,
    addUser,
    gender,
  };

  const jsonData = {
    UserInfo: {
      ...userData,
      terminalNoList,
    },
  };

  return { userData, jsonData };
};

module.exports = { buildUserObjects };
