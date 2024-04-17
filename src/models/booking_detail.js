'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking_detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Booking_detail.belongsTo(models.Booking,{foreignKey: 'bookingId'});
      Booking_detail.belongsTo(models.Room,{foreignKey: 'roomId'});
      Booking_detail.belongsTo(models.Day_room,{foreignKey: 'bookingDetailId'});
    }
  }
  Booking_detail.init({
    bookingId: DataTypes.STRING,
    roomId: DataTypes.STRING,
    quantity: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Booking_detail',
  });
  return Booking_detail;
};