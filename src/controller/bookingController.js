import BookingStatusEnum from "../enums/bookingStatusEnum";
import { v4 as uuidv4 } from "uuid";
import db from "../models/index";

let getRoomBooking = async (req, res) => {
    let categoryList = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest: true,
    });
    let count = await db.Room.count({
        where: {
            roomCategoryId: 2,
            status: "Trống",
        },
    });
    return res.render("./roomBooking.ejs", {
        user: req.user,
        categoryList,
        count,
    });
};

let postRoomBooking = async (req, res, next) => {
    try {
        const body = req.body;
        const booking = await db.Booking.create({
            userId: req.user.id,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            status: BookingStatusEnum.WAIT,
            code: uuidv4(),
        });

        const bookingDetailData = body.rooms.map((room) => ({
            ...room,
            bookingId: booking.id,
        }));

        await db.Booking_detail.bulkCreate(bookingDetailData);

        return res.json(booking);
    } catch (error) {
        console.log(error);
        next(error);
    }
};

module.exports = {
    getRoomBooking,
    postRoomBooking,
};
