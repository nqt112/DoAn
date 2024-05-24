import db from "../models/index";
const { Op } = require("sequelize");
import moment from "moment";
import dayRoomStatus from "../enums/dayRoomStatusEnum"

let getDayroom = async (req, res) => {
  return res.render("./dayroom/dayroomlist.ejs",{
    dayRoomStatus : dayRoomStatus
  });
};

const getAllRoomStatus = async (req, res) => {
  const today = moment().startOf('day').toISOString();
  const floor = req.query.floor || "all";
  const status = req.query.status || "all";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;
  const search = req.query.search || "";

  try {
    // Lấy tất cả các phòng
    let roomsQuery = { where: {} };
    if (floor !== "all") {
      roomsQuery.where.floor = floor;
    }
    if (search) {
      roomsQuery.where.roomNumber = {
        [Op.like]: `%${search}%`,
      };
    }

    const startDate = req.query.startDate ? moment(req.query.startDate).startOf('day').toISOString() : today;
    const endDate = req.query.endDate ? moment(req.query.endDate).endOf('day').toISOString() : today;

    const rooms = await db.Room.findAndCountAll({
      ...roomsQuery,
      limit,
      offset,
    });

    // Lấy tất cả các DayRoom và lọc theo thời gian checkin từ bảng Booking
    const dayRooms = await db.Day_room.findAll({
      
      include: [
        {
          model: db.Booking,
          where: {
            checkIn: {
              [Op.between]: [startDate, endDate] // Lọc theo thời gian checkin
            }
          },
          include: [
            {
              model: db.Booking_detail,
            },
            {
              model: db.User,
              attributes: ["id", "fullname"],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });
    // Tạo map để dễ tra cứu trạng thái phòng theo RoomId
    const dayRoomMap = dayRooms.reduce((map, dayRoom) => {
      map[dayRoom.RoomId] = dayRoom;
      return map;
    }, {});
    
    // Kết hợp thông tin phòng và trạng thái
    const result = rooms.rows
    .map((room) => {
      const dayRoom = dayRoomMap[room.id];
        return {
          RoomId: room.id,
          RoomName: room.roomNumber,
          Status: dayRoom ? dayRoomStatus.DADAT : dayRoomStatus.CONTRONG,
          CustomerName: dayRoom && dayRoom.Booking ? dayRoom.Booking.User.fullname : "",
          Checkin: dayRoom && dayRoom.Booking ? moment(dayRoom.Booking.checkIn).format('DD-MM-YYYY') : "",
          Checkout: dayRoom && dayRoom.Booking ? moment(dayRoom.Booking.checkOut).format('DD-MM-YYYY') : "",
          Code: dayRoom && dayRoom.Booking ? dayRoom.Booking.code : "",
        };
      })
      .filter((room) => {
        if (status === "all") return true;
        if (status === "available" && room.Status === dayRoomStatus.CONTRONG) return true;
        if (status === "occupied" && room.Status ===  dayRoomStatus.DADAT ) return true;
        return false;
      });

    res.status(200).json({ total: rooms.count, rooms: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRoomStatus = async (req, res) => {
  const { RoomId, BookingDetailId, Status, Date } = req.body;

  try {
    // Kiểm tra nếu bản ghi tồn tại
    let dayRoom = await db.Day_room.findOne({
      where: { RoomId: RoomId, Date: Date },
    });

    if (dayRoom) {
      // Cập nhật bản ghi nếu đã tồn tại
      await dayRoom.update({
        Status: Status,
        BookingDetailId: BookingDetailId,
      });
    } else {
      // Tạo mới nếu không tồn tại
      await db.Day_room.create({
        RoomId: RoomId,
        Status: Status,
        Date: Date,
        BookingDetailId: BookingDetailId,
      });
    }

    res.status(200).json({ message: "Room status updated successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getDayroom,
  getAllRoomStatus,
  updateRoomStatus,
};
