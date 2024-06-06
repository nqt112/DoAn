import BookingStatusEnum from "../enums/bookingStatusEnum";
import { stringify, v4 as uuidv4 } from "uuid";
import db from "../models/index";
import { where } from "sequelize";
import moment from "moment";
const { Op } = require("sequelize");
const nodemailer = require("nodemailer");

require("dotenv").config();
const moneyFormat = (money) => {
  if (isNaN(money)) {
    return "0 ₫"; // Trả về giá trị mặc định nếu không phải là số
  }
  const formatter = new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  });
  return formatter.format(money);
};
let transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
let getAdminBookingList = async (req, res) => {
  return res.render("./booking/bookinglist", {
    bookingStatus: BookingStatusEnum,
  });
};
const getRoomBooking = async (req, res) => {
  let category = await db.Room_category.findAll({
      raw: true,
      nest: true,
  });

  const categoryList = category.map((booking) => {
      return {
          ...booking,
          price: moneyFormat(booking.price),
      };
  });

  // Call the getAvailableRooms API
  const { startDate, endDate } = req.query;
  const availableRoomsResponse = await getAvailableRoomsInternal(startDate, endDate);

  return res.render("./roomBooking.ejs", {
      user: req.user,
      categoryList,
      availableRoomCounts: availableRoomsResponse.availableRoomCounts
  });
};

// Define an internal function to call getAvailableRooms
const getAvailableRoomsInternal = async (startDate, endDate) => {
  const dayRoomStatus = { CONTRONG: 'available' };  // Replace this with the actual status if needed

  try {
     const startDateISO = startDate ? moment(startDate).startOf('day').toISOString() : moment().startOf('day').toISOString();
    const endDateISO = endDate ? moment(endDate).endOf('day').toISOString() : moment().endOf('day').toISOString();

      const rooms = await db.Room.findAll();

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

      const availableRooms = rooms.filter(room => !bookedRoomIds.includes(room.id));

      const availableRoomCounts = availableRooms.reduce((counts, room) => {
          if (!counts[room.roomCategoryId]) {
              counts[room.roomCategoryId] = 0;
          }
          counts[room.roomCategoryId]++;
          return counts;
      }, {});

      return { availableRoomCounts };
  } catch (error) {
      console.error(error);
      return { availableRoomCounts: {} };
  }
};


let postRoomBooking = async (req, res, next) => {
    const uuid = uuidv4();
    const formattedUuid = uuid.substring(0, 13); // Remove hyphens and take the first 13 characters
  try {
    const body = req.body;
    const booking = await db.Booking.create({
      userId: req.user.id,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      total_price: body.total_price,
      status: BookingStatusEnum.WAIT,
      code: formattedUuid,
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

const getBookingListStatus = async (req, res) => {
  const { status, startDate, endDate, itemsPerPage = 6, page = 1 } = req.query;
  const offset = (page - 1) * itemsPerPage;

  let queryOptions = {
    include: [
      {
        model: db.User,
        attributes: ["fullname"],
      },
      {
        model: db.Booking_service,
        attributes: ["total_price"],
      },
    ],
    nested: true,
    limit: parseInt(itemsPerPage), // Giới hạn số lượng kết quả trả về
    offset: parseInt(offset), // Vị trí bắt đầu của trang
  };

  if (status) {
    queryOptions.where = { ...queryOptions.where, status: status };
  }
  if (startDate && endDate) {
    queryOptions.where = {
      ...queryOptions.where,
      checkIn: {
        [Op.between]: [
          moment(startDate).startOf("day").toISOString(),
          moment(endDate).endOf("day").toISOString(),
        ],
      },
    };
  }

  try {
    const totalBookings = await db.Booking.count({ where: queryOptions.where });
    const bookings = await db.Booking.findAll(queryOptions);

    const totalPages = Math.ceil(totalBookings / itemsPerPage);

    const formattedBookings = bookings.map((booking) => {
      let additionalPrice = 0;
      if (Array.isArray(booking.Booking_services)) {
        additionalPrice = booking.Booking_services.reduce((acc, service) => {
          // Calculate the price for each service and add to the accumulator
          return acc + service.total_price;
        }, 0);
      }
      const totalPrice = booking.total_price + additionalPrice;
      return {
        ...booking.get({ plain: true }),
        total_price: moneyFormat(totalPrice),
        checkIn: moment(booking.checkIn).format("DD-MM-YYYY"),
        checkOut: moment(booking.checkOut).format("DD-MM-YYYY"),
        createdAt: moment(booking.createdAt).format("DD-MM-YYYY HH:mm:ss"),
      };
    });

    if (req.xhr) {
      return res.json({
        bookingList: formattedBookings,
        bookingStatus: BookingStatusEnum,
        totalPages: totalPages,
      });
    } else {
      // Handle non-AJAX requests
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

let getBookingDetailPage = async (req, res) => {
  let userId = req.user.id;
  const moneyFormat = (money) => {
    if (isNaN(money)) {
      return "0 ₫"; // Trả về giá trị mặc định nếu không phải là số
    }
    const formatter = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    });
    return formatter.format(money);
  };
  try {
    const booking = await db.Booking.findAll({
      where: { userId: userId },
      include: [
        {
          model: db.User,
        },
      ],
      raw: true,
      nest: true,
      group: ["Booking.id"],
    });
    const formattedBookings = booking.map((booking) => {
      return {
        ...booking,
        total_price: moneyFormat(booking.total_price),
        checkIn: moment(booking.checkIn).format("DD-MM-YYYY"),
        checkOut: moment(booking.checkOut).format("DD-MM-YYYY"),
        createdAt: moment(booking.createdAt).format("DD-MM-YYYY HH:mm:ss"),
      };
    });

    let bookingList = formattedBookings;

    return res.render("./bookingDetail.ejs", {
      user: req.user,
      bookingList: bookingList,
    });
  } catch (error) {
    return res.json(error);
  }
};
let getModalDetail = async (req, res) => {
  const moneyFormat = (money) => {
    if (isNaN(money)) {
      return "0 ₫"; // Trả về giá trị mặc định nếu không phải là số
    }
    const formatter = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    });
    return formatter.format(money);
  };
  try {
    // Lấy id của đơn đặt từ yêu cầu
    let bookingid = req.params.id;
    // Lấy thông tin các phòng tương ứng với đơn đặt
    const bookingDetail = await db.Booking_detail.findAll({
      where: { bookingId: bookingid }, // Lọc các đơn đặt dựa trên id
      include: [
        {
          model: db.Room_category,
          attributes: ["id", "name", "price", "numberOfPeople"],
        },
        {
          model: db.Room,
          attributes: ["id", "roomCategoryId", "roomNumber", "floor"],
        },
        {
          model: db.Booking,
          attributes: ["id", "total_price", "code"],
        },
      ],
      raw: true,
      nest: true,
    });
    const formattedDetail = bookingDetail.map((booking) => {
      return {
        ...booking,
        price: moneyFormat(booking.Room_category.price),
        total_price: moneyFormat(booking.Booking.total_price),
      };
    });
    let bookingDetailList = formattedDetail;
    return res.json(bookingDetailList);
  } catch (error) {
    return res.json(error);
  }
};
let getServiceList = async (req, res) => {
  try {
    const serviceList = await db.Service.findAll({
      attributes: ["id", "name", "price"],
      raw: true,
      nest: true,
    });
    return res.json(serviceList);
  } catch (error) {
    return res.json(error);
  }
};
let postBookingService = async (req, res) => {
  try {
    const body = req.body;
    const bookingService = body.services.map((service) => ({
      ...service,
    }));
    await db.Booking_service.bulkCreate(bookingService);
    return res.json(bookingService);
  } catch (error) {
    return res.json(error);
  }
};
let getBookingServiceDetail = async (req, res) => {
  const moneyFormat = (money) => {
    if (isNaN(money)) {
      return "0 ₫"; // Trả về giá trị mặc định nếu không phải là số
    }
    const formatter = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    });
    return formatter.format(money);
  };
  try {
    // Lấy id của đơn đặt từ yêu cầu
    let bookingid = req.params.id;
    // Lấy thông tin các phòng tương ứng với đơn đặt
    const serviceDetail = await db.Booking_service.findAll({
      where: { bookingId: bookingid }, // Lọc các đơn đặt dựa trên id
      include: [
        {
          model: db.Service,
          attributes: ["id", "name", "price"],
        },
      ],
      raw: true,
      nest: true,
    });

    const formattedDetail = serviceDetail.map((service) => {
      return {
        ...service,
        price: moneyFormat(service.Service.price),
        createdAt: moment(service.createdAt).format("DD-MM-YYYY HH:mm:ss"),
      };
    });
    let serviceDetailList = formattedDetail;
    return res.json(serviceDetailList);
  } catch (error) {
    return res.json(error);
  }
};

let postDeleteService = async (req, res) => {
  const serviceId = req.params.id;

  // Logic to delete the service from the database
  await db.Booking_service.destroy({ where: { id: serviceId } })
    .then(() => res.sendStatus(200))
    .catch((err) => res.status(500).send(err));
};
let postConfirmBooking = async (req, res) => {
  const bookingId = req.body.id;
  try {
    await db.Booking.update(
      { status: BookingStatusEnum.CONFIRM },
      { where: { id: bookingId } }
    );
    const updatedBooking = await db.Booking.findOne({
      where: { id: bookingId },
      include: [
        {
          model: db.User,
        },
      ],
      raw: true,
      nest: true,
    });
    // Định dạng lại số tiền
    const formattedTotalPrice = new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(updatedBooking.total_price);
    const formatCheckin = moment(updatedBooking.checkIn).format("DD-MM-YYYY");
    const formatCheckout = moment(updatedBooking.checkOut).format("DD-MM-YYYY");
    const formatCreated = moment(updatedBooking.createdAt).format(
      "DD-MM-YYYY HH:mm:ss"
    );
    let mailOptions = {
      from: process.env.EMAIL_USER,
      to: updatedBooking.User.email,
      subject: "Xác nhận đơn đặt phòng",
      html: `
          <h2>Xin chào khách hàng: ${updatedBooking.User.fullname}</h2>
          <p>Thông tin chi tiết đơn đặt của bạn:</p>
          <p>Ngày đặt: ${formatCreated}</p>  
          <p><b>Checkin: ${formatCheckin}</b></p>
          <p><b>Checkout: ${formatCheckout}</b></p>
          <p><b>Tổng tiền: ${formattedTotalPrice}</b></p>
          <div>
          <h2>Xin chân thành cảm ơn đã sử dụng dịch vụ của chúng tôi!</h2>
          </div>
        `,
    };
    transporter.sendMail(mailOptions, function (error, info) {
      if (error) {
        console.log(error);
        return res
          .status(500)
          .json({ error: "Xác nhận thành công nhưng gửi email thất bại" });
      } else {
        res.send(`Đã gửi email xác nhận tới: ${updatedBooking.User.email}`);
        console.log("Email sent: " + info.response);
        return res.json(updatedBooking);
      }
    });
  } catch (error) {
    return res.status(500).json({ error: "Cập nhật trạng thái thất bại" });
  }
};
const postCheckinBooking = async (req, res, next) => {
  const { id, status } = req.body;
  try {
    await db.Booking.update(
      { status: BookingStatusEnum.CHECKIN },
      { where: { id } }
    );
    const updatedBooking = await db.Booking.findOne({
      where: { id },
      raw: true,
      nest: true,
    });
    return res.json(updatedBooking);
  } catch (error) {
    return res.status(500).json({ error: "Cập nhật trạng thái thất bại" });
  }
};
const postCheckoutBooking = async (req, res, next) => {
  const { id, status } = req.body;
  try {
    // Lấy thông tin chi tiết đặt phòng và thông tin người dùng
    const bookingDetail = await db.Booking_detail.findAll({
      where: { bookingId: id },
      include: [
        {
          model: db.Room_category,
          attributes: ["id", "name", "price", "numberOfPeople"],
        },
        {
          model: db.Room,
          attributes: ["id", "roomCategoryId", "roomNumber", "floor"],
        },
        {
          model: db.Booking,
          attributes: [
            "id",
            "total_price",
            "checkIn",
            "checkOut",
            "userId",
            "code",
          ],
          include: [
            {
              model: db.User,
              attributes: ["id", "fullname", "email"],
            },
          ],
        },
      ],
      raw: true,
      nest: true,
    });

    // Lấy thông tin dịch vụ
    const serviceDetail = await db.Booking_service.findAll({
      where: { bookingId: id },
      include: [
        {
          model: db.Service,
          attributes: ["id", "name", "price"],
        },
      ],
      raw: true,
      nest: true,
    });

    // Tính tổng tiền phòng từ giá trị total_price của Booking
    const totalRoomPrice = bookingDetail.reduce(
      (acc, room) => room.Booking.total_price,
      0
    );
    // Tính tổng tiền dịch vụ
    const totalServicePrice = serviceDetail.reduce(
      (acc, service) => acc + service.Service.price * service.quantity,
      0
    );
    // Tạo UUID cho hoá đơn
    const invoiceId = uuidv4();
    const formattedUuid = invoiceId.substring(0, 13); // Remove hyphens and take the first 13 characters
    // Lưu thông tin hoá đơn vào bảng export_invoice
    await db.Booking.update(
      { status: BookingStatusEnum.CHECKOUT },
      { where: { id } }
    );
    const updatedBooking = await db.Booking.findOne({
      where: { id },
      raw: true,
      nest: true,
    });
    await db.Export_invoice.create({
      bookingId: id,
      invoice_code: formattedUuid,
      total_price: totalRoomPrice + totalServicePrice,
      export_day: moment().format("YYYY-MM-DD"), // Định dạng ngày xuất hóa đơn theo định dạng ngày
    });
    return res.json(updatedBooking);
  } catch (error) {
    return res.status(500).json({ error: "Cập nhật trạng thái thất bại" });
  }
};
const postCancelBooking = async (req, res, next) => {
  const { id, status } = req.body;
  try {
    await db.Booking.update(
      { status: BookingStatusEnum.CANCEL },
      { where: { id } }
    );
    const updatedBooking = await db.Booking.findOne({
      where: { id },
      raw: true,
      nest: true,
    });
    return res.json(updatedBooking);
  } catch (error) {
    return res.status(500).json({ error: "Cập nhật trạng thái thất bại" });
  }
};

module.exports = {
  getRoomBooking,
  postRoomBooking,
  getAdminBookingList,
  getBookingDetailPage,
  getModalDetail,
  getServiceList,
  postBookingService,
  getBookingServiceDetail,
  postDeleteService,
  postConfirmBooking,
  postCheckinBooking,
  postCheckoutBooking,
  getBookingListStatus,
  postCancelBooking,
};
