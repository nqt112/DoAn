'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Booking_service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Booking_service.belongsTo(models.Service, {foreignKey: 'serviceId'});
      Booking_service.belongsTo(models.Booking, {foreignKey: 'bookingId'});
    }
  }
  Booking_service.init({
    bookingId: DataTypes.INTEGER,
    serviceId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    total_price: DataTypes.DOUBLE,
  }, {
    sequelize,
    modelName: 'Booking_service',
  });
  return Booking_service;
};