'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Export_invoice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // Export_invoice.belongsTo(models.Service, {foreignKey: 'serviceId'});
      Export_invoice.belongsTo(models.Booking, {foreignKey: 'bookingId'});
    }
  }
  Export_invoice.init({
    bookingId: DataTypes.INTEGER,
    invoice_code: DataTypes.STRING,
    total_price: DataTypes.DOUBLE,
    export_day: DataTypes.DATEONLY,
  }, {
    sequelize,
    modelName: 'Export_invoice',
  });
  return Export_invoice;
};