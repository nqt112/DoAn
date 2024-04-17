'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Room_category extends Model {

    static associate(models) {
      Room_category.hasMany(models.Room, {foreignKey: 'roomCategoryId'});
      Room_category.hasMany(models.Invoice_detail, { foreignKey: 'roomCategoryId'});
    }
  }
  Room_category.init({
    name: DataTypes.STRING,
    square: DataTypes.DECIMAL(10,2),
    numberOfPeople: DataTypes.INTEGER,
    typeOfBed: DataTypes.STRING,
    price: DataTypes.DECIMAL(30,3),
    description: DataTypes.STRING,
    image: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Room_category',
  });
  return Room_category;
};