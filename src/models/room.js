'use strict';

const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Room.belongsTo(models.Room_category, {foreignKey: 'roomCategoryId'});
      Room.hasMany(models.Booking_detail, {foreignKey: 'roomId'});
      Room.hasMany(models.Day_room), {foreignKey: 'roomId'};
    }
  }
  Room.init({
    roomCategoryId: {
      type: DataTypes.INTEGER,
    },
    roomNumber: DataTypes.STRING,
    floor: DataTypes.INTEGER,
    status: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Room',
  });
  return Room;
};