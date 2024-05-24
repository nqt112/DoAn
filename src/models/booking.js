"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
    class Booking extends Model {
        /**
         * Helper method for defining associations.
         * This method is not a part of Sequelize lifecycle.
         * The `models/index` file will call this method automatically.
         */
        static associate(models) {
            Booking.belongsTo(models.User, { foreignKey: "userId" });
            // Booking.hasOne(models.Invoice, { foreignKey: "bookingId" });
            Booking.hasMany(models.Booking_detail, { foreignKey: "bookingId" },{
                onDelete: 'SETNULL',
                onUpdate: 'CASCADE',
            });
            Booking.hasMany(models.Booking_service, { foreignKey: "bookingId" });
            Booking.hasMany(models.Day_room, { foreignKey: "bookingId" });
            Booking.hasOne(models.Export_invoice, { foreignKey: "bookingId" });
        }
    }
    Booking.init(
        {
            userId: DataTypes.INTEGER,
            code: DataTypes.STRING,
            checkIn: DataTypes.DATEONLY,
            checkOut: DataTypes.DATEONLY,
            total_price: DataTypes.DOUBLE,
            status: DataTypes.STRING,
        },
        {
            sequelize,
            modelName: "Booking",
        }
    );
    return Booking;
};
