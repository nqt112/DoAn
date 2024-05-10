'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Invoice extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      Invoice.belongsTo(models.User,{foreignKey: 'userId'});
      Invoice.hasOne(models.Booking,{foreignKey: 'bookingId'});
      Invoice.hasMany(models.Invoice_detail,{foreignKey: 'invoiceId'});
    }
  }
  Invoice.init({
    userId: DataTypes.INTEGER,
    bookingId: DataTypes.INTEGER,
    code: DataTypes.STRING,
    totalPrice: DataTypes.DECIMAL(30,3),
    type: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'Invoice',
  });
  return Invoice;
};