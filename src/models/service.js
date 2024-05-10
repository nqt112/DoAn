'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Service extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Service.hasMany(models.Invoice_detail, {foreignKey: 'serviceId'});
      Service.hasMany(models.Booking_service, {foreignKey: 'serviceId'});
    }
  }
  Service.init({
    name: DataTypes.STRING,
    image: DataTypes.STRING,
    price: DataTypes.DOUBLE,
    description: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Service',
  });
  return Service;
};