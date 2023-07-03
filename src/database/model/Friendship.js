const { Model, DataTypes } = require("sequelize");
const { sequelize } = require("../connection");

class Friendship extends Model {}

Friendship.init(
  {
    id: {
      type: DataTypes.BIGINT.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    conversationId: {
      type: DataTypes.BIGINT.UNSIGNED,
      allowNull: false,
      field: "conversation_id",
    },
    userId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "user_id",
    },
    friendId: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "friend_id",
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "created_at",
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "updated_at",
    },
  },
  {
    sequelize,
    modelName: "Friendship",
    tableName: "friendships",
  }
);

module.exports = Friendship;
