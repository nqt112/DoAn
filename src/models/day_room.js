'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Day_room extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Day_room.belongsTo(models.Room,{foreignKey: 'roomId'});
      Day_room.belongsTo(models.Booking_detail,{foreignKey: 'bookingDetailId'});
      Day_room.belongsTo(models.Booking,{foreignKey: 'bookingId'});
    }
  }
  Day_room.init({
    roomId: DataTypes.INTEGER,
    bookingDetailId: DataTypes.INTEGER,
    bookingId: DataTypes.INTEGER,
    status: DataTypes.STRING,
    date: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'Day_room',
  });
  return Day_room;
};