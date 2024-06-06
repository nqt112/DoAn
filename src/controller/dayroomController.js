import db from "../models/index";
const { Op } = require("sequelize");
import moment from "moment";
import dayRoomStatus from "../enums/dayRoomStatusEnum"

let getDayroom = async (req, res) => {
  try{
    const roomCategories = await db.Room_category.findAll();
    return res.render("./dayroom/dayroomlist.ejs",{
      dayRoomStatus : dayRoomStatus, roomCategories
    });
  }catch(err){
    console.log(err);
  }
};

const getAllRoomStatus = async (req, res) => {
  const today = moment().startOf('day').toISOString();
  const floor = req.query.floor || "all";
  const status = req.query.status || "all";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
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
            [Op.or]: [
              {
                checkIn: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                checkOut: {
                  [Op.between]: [startDate, endDate]
                }
              },
              {
                checkIn: {
                  [Op.lte]: startDate
                },
                checkOut: {
                  [Op.gte]: startDate
                }
              }
            ]
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
        if (status === "occupied" && room.Status === dayRoomStatus.DADAT) return true;
        return false;
      });

    res.status(200).json({ total: rooms.count, rooms: result });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
const getAvailableRooms = async (req, res) => {
  const { startDate, endDate, roomType } = req.query;

  try {
    // const startDateISO = startDate ? moment(startDate).startOf('day').toISOString() : moment().startOf('day').toISOString();
    // const endDateISO = endDate ? moment(endDate).endOf('day').toISOString() : moment().endOf('day').toISOString();
    const startDateISO = startDate 
    const endDateISO = endDate 

    let roomFilter = roomType ? { roomCategoryId: roomType } : {};

    const rooms = await db.Room.findAll({
      where: roomFilter,
    });

    const bookedRooms = await db.Day_room.findAll({
      include: [
        {
          model: db.Booking,
          where: {
            [Op.or]: [
              {
                checkIn: {
                  [Op.between]: [startDateISO, endDateISO]
                }
              },
              {
                checkOut: {
                  [Op.between]: [startDateISO, endDateISO]
                }
              },
              {
                checkIn: {
                  [Op.lte]: startDateISO
                },
                checkOut: {
                  [Op.gte]: endDateISO
                }
              }
            ]
          }
        }
      ],
      raw: true,
      nest: true,
    });

    const bookedRoomIds = bookedRooms.map(dayRoom => dayRoom.RoomId);

    const availableRooms = rooms
      .filter(room => !bookedRoomIds.includes(room.id))
      .map(room => ({
        RoomId: room.id,
        RoomName: room.roomNumber,
        RoomType: room.roomCategoryId,
        Floor: room.floor,
        Status: dayRoomStatus.CONTRONG, 
      }));

    const availableRoomCounts = availableRooms.reduce((counts, room) => {
      if (!counts[room.RoomType]) {
        counts[room.RoomType] = 0;
      }
      counts[room.RoomType]++;
      return counts;
    }, {});

    res.status(200).json({ 
      total: availableRooms.length, 
      rooms: availableRooms, 
      availableRoomCounts : availableRoomCounts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
let postUpdateDayroom = async (req, res) => {
  const { bookingId, selectedRooms } = req.body;
  try {
    // Xóa các phòng ngày cũ
    await db.Day_room.destroy({ where: { bookingId: bookingId } });
    
    // Thêm các phòng ngày mới
    const dayRooms = selectedRooms.map(roomId => ({
      bookingId: bookingId,
      roomId: roomId
    }));
    await db.Day_room.bulkCreate(dayRooms);
    
    res.status(200).json({ message: 'Rooms saved successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to save rooms' });
  }
};

const getBookedRooms = async (req, res) => {
  const { bookingId } = req.query;
  try {
    const dayRooms = await db.Day_room.findAll({
      where: { bookingId: bookingId },
      include: [{
        model: db.Room,
        attributes: ['id', 'roomNumber']
      }],
      raw: true,
      nest: true
    });

    const bookedRooms = dayRooms.map(dayRoom => ({
      RoomId: dayRoom.Room.id,
      RoomName: dayRoom.Room.roomNumber
    }));

    res.status(200).json({ rooms: bookedRooms });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch booked rooms' });
  }
};
let getBookingId = async (req, res) => {
  const { bookingCode } = req.query;
  try {
    const booking = await db.Booking.findOne({ where: { code:bookingCode } });
    if (booking) {
      res.status(200).json({ 
        bookingId: booking.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut

       });
    } else {
      res.status(404).json({ message: 'Booking not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to fetchs booking ID' });
  }
};


module.exports = {
  getDayroom,
  getAllRoomStatus,
  getAvailableRooms,
  postUpdateDayroom,
  getBookingId,
  getBookedRooms
};
