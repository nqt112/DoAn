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
      Day_room.hasMany(models.Booking_detail,{foreignKey: 'bookingDetailId'});
    }
  }
  Day_room.init({
    roomId: DataTypes.INTEGER,
    bookingDetailId: DataTypes.INTEGER,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'Day_room',
  });
  return Day_room;
};