const { Sequelize, DataTypes } = require("sequelize");

const sequelize = new Sequelize("chatzone", "root", "09212440633a", {
  host: "localhost",
  port: "3306",
  dialect: "mysql",
  dialectOptions: {
    useUTC: false,
    dateStrings: true,
    typeCast: function (field, next) {
      if (field.type === "DATETIME") {
        return field.string();
      }
      return next();
    },
  },
  timezone: "+08:00",
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Unable to connect to the database:", error);
  }
};

module.exports = {
  test: testConnection,
  sequelize: sequelize,
};
