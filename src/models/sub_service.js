'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Sub_service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Sub_service.belongsTo(models.Service, {foreignKey: 'serviceId'});
      Sub_service.belongsTo(models.Booking, {foreignKey: 'bookingId'});
    }
  }
  Sub_service.init({
    bookingId: DataTypes.INTEGER,
    serviceId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'Sub_service',
  });
  return Sub_service;
};