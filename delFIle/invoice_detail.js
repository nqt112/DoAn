'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice_detail extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Invoice_detail.belongsTo(models.Room_category, {foreignKey: 'roomCategoryId'});
      Invoice_detail.belongsTo(models.Invoice, {foreignKey: 'invoiceId'});
      Invoice_detail.belongsTo(models.Service, {foreignKey: 'serviceId'});
        
    }
  }
  Invoice_detail.init({
    invoiceId: DataTypes.INTEGER,
    roomCategoryId: DataTypes.INTEGER,
    serviceId: DataTypes.INTEGER,
    quantity: DataTypes.INTEGER,
    price: DataTypes.DECIMAL(30,3),
  }, {
    sequelize,
    modelName: 'Invoice_detail',
  });
  return Invoice_detail;
};