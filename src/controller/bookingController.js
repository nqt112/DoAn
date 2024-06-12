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
  let roomType = await db.Room_category.findAll({
    attributes: ["id", "name"],
    raw: true,
    nest: true,
  });
  let serviceType = await db.Service.findAll({
    attributes: ["id", "name"],
    raw: true,
    nest: true,
  });
  return res.render("./booking/bookinglist", {
    bookingStatus: BookingStatusEnum,
    roomType: roomType,
    serviceType: serviceType,
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
  const availableRoomsResponse = await getAvailableRoomsInternal(
    startDate,
    endDate
  );

  return res.render("./roomBooking.ejs", {
    user: req.user,
    categoryList,
    availableRoomCounts: availableRoomsResponse.availableRoomCounts,
  });
};

// Define an internal function to call getAvailableRooms
const getAvailableRoomsInternal = async (startDate, endDate) => {
  const dayRoomStatus = { CONTRONG: "available" }; // Replace this with the actual status if needed

  try {
    const startDateISO = startDate
      ? moment(startDate).startOf("day").toISOString()
      : moment().startOf("day").toISOString();
    const endDateISO = endDate
      ? moment(endDate).endOf("day").toISOString()
      : moment().endOf("day").toISOString();

    const rooms = await db.Room.findAll();

    const bookedRooms = await db.Day_room.findAll({
      include: [
        {
          model: db.Booking,
          where: {
            [Op.or]: [
              {
                checkIn: {
                  [Op.between]: [startDateISO, endDateISO],
                },
              },
              {
                checkOut: {
                  [Op.between]: [startDateISO, endDateISO],
                },
              },
              {
                checkIn: {
                  [Op.lte]: startDateISO,
                },
                checkOut: {
                  [Op.gte]: endDateISO,
                },
              },
            ],
          },
        },
      ],
      raw: true,
      nest: true,
    });

    const bookedRoomIds = bookedRooms.map((dayRoom) => dayRoom.RoomId);

    const availableRooms = rooms.filter(
      (room) => !bookedRoomIds.includes(room.id)
    );

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
      bookingStatus: BookingStatusEnum,
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
          attributes: ["id", "total_price", "code", "status"],
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
        {
          model: db.Booking,
          attributes: ["id", "status"],
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
// const postOfflineBooking = async (req, res, next) => {
//   const { fullname, phone, email, checkIn, checkOut, rooms, services } =
//     req.body;
//   const uuid = uuidv4();
//   const formattedUuid = uuid.substring(0, 13);

//   try {
//     // Lấy giá phòng từ cơ sở dữ liệu
//     const roomPrices = await db.Room_category.findAll({
//       attributes: ["id", "price"],
//       raw: true,
//       nest: true,
//     });

//     // Lấy giá dịch vụ từ cơ sở dữ liệu
//     const servicePrices = await db.Service.findAll({
//       attributes: ["id", "price"],
//       raw: true,
//       nest: true,
//     });

//     // Tính tổng số ngày thuê
//     const checkInDate = new Date(checkIn);
//     const checkOutDate = new Date(checkOut);
//     const numberOfDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24));

//     // Tính tổng tiền phòng
//     let roomTotal = 0;
//     rooms.forEach((room) => {
//       const roomPrice = roomPrices.find((r) => r.id === room.id)?.price || 0;
//       roomTotal += roomPrice * room.quantity * numberOfDays;
//     });

//     // Tính tổng tiền dịch vụ
//     let serviceTotal = 0;
//     services.forEach((service) => {
//       const servicePrice = servicePrices.find((s) => s.id === service.id)?.price || 0;
//       serviceTotal += servicePrice * service.quantity;
//     });


//     // Tạo đối tượng người đặt mới
//     const user = await db.User.create({ fullname, phone, email, role: 1 });

//     // Tạo đơn đặt mới
//     const booking = await db.Booking.create({
//       userId: user.id,
//       code: formattedUuid,
//       checkIn,
//       checkOut,
//       status: BookingStatusEnum.CONFIRM,
//       total_price: roomTotal, // Lưu tổng tiền vào cơ sở dữ liệu
//     });

//     // Chuẩn bị dữ liệu cho bulkCreate
//     const roomDetails = rooms.map((room) => ({
//       bookingId: booking.id,
//       roomCategoryId: room.id,
//       quantity: room.quantity,
//     }));
//     const serviceDetails = services.map((service) => ({
//       bookingId: booking.id,
//       serviceId: service.id,
//       quantity: service.quantity,
//       total_price: ,
//     }));

//     // Sử dụng bulkCreate để lưu thông tin phòng và dịch vụ đặt vào cơ sở dữ liệu
//     await db.Booking_detail.bulkCreate(roomDetails);
//     await db.Booking_service.bulkCreate(serviceDetails);

//     res
//       .status(200)
//       .json({
//         message: "Đơn đặt đã được lưu thành công.",
//         bookingId: booking.id,
//       });
//   } catch (error) {
//     console.error("Lỗi khi lưu đơn đặt:", error);
//     res.status(500).json({ error: "Đã xảy ra lỗi khi lưu đơn đặt." });
//   }
// };
const postOfflineBooking = async (req, res, next) => {
  const { fullname, phone, email, checkIn, checkOut, rooms, services } = req.body;
  const uuid = uuidv4();
  const formattedUuid = uuid.substring(0, 13);

  try {
    // Lấy giá phòng từ cơ sở dữ liệu
    const roomPrices = await db.Room_category.findAll({
      attributes: ["id", "price"],
      raw: true,
      nest: true,
    });
    console.log("roomPrices:", roomPrices); // Kiểm tra dữ liệu lấy từ cơ sở dữ liệu

    // Lấy giá dịch vụ từ cơ sở dữ liệu
    const servicePrices = await db.Service.findAll({
      attributes: ["id", "price"],
      raw: true,
      nest: true,
    });
    console.log("servicePrices:", servicePrices); // Kiểm tra dữ liệu lấy từ cơ sở dữ liệu

    // Tính tổng số ngày thuê
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const numberOfDays = Math.ceil((checkOutDate - checkInDate) / (1000 * 3600 * 24));
    console.log("numberOfDays:", numberOfDays); // Kiểm tra số ngày

    // Tính tổng tiền phòng
    let roomTotal = 0;
    rooms.forEach((room) => {
      const roomPrice = roomPrices.find((r) => r.id === parseInt(room.id))?.price || 0;
      console.log(`Room ID: ${room.id}, Room Price: ${roomPrice}`); // Kiểm tra giá phòng tương ứng
      roomTotal += roomPrice * room.quantity * numberOfDays;
    });
    console.log("roomTotal:", roomTotal); // Kiểm tra tổng tiền phòng

    // Tính tổng tiền dịch vụ và chuẩn bị dữ liệu để lưu thông tin từng dịch vụ vào cơ sở dữ liệu
    let totalServiceAmount = 0;
    const serviceDetails = services.map((service) => {
      const servicePrice = servicePrices.find((s) => s.id === parseInt(service.id))?.price || 0;
      const serviceTotal = servicePrice * service.quantity;
      console.log(`Service ID: ${service.id}, Service Price: ${servicePrice}, Service Total: ${serviceTotal}`); // Kiểm tra giá dịch vụ và tổng tiền
      totalServiceAmount += serviceTotal;

      return {
        bookingId: null, // Placeholder for now, will set after creating booking
        serviceId: service.id,
        quantity: service.quantity,
        total_price: serviceTotal, // Lưu tổng tiền của từng dịch vụ vào cơ sở dữ liệu
      };
    });
    console.log("totalServiceAmount:", totalServiceAmount); // Kiểm tra tổng tiền dịch vụ

    // Tạo đối tượng người đặt mới
    const user = await db.User.create({ fullname, phone, email, role: 1 });

    // Tạo đơn đặt mới với tổng tiền đã tính sẵn
    const booking = await db.Booking.create({
      userId: user.id,
      code: formattedUuid,
      checkIn,
      checkOut,
      status: BookingStatusEnum.CONFIRM,
      total_price: roomTotal, // Tổng tiền phòng + tổng tiền dịch vụ
    });
    console.log("booking.total_price:", booking.total_price); // Kiểm tra tổng tiền của booking

    // Chuẩn bị dữ liệu cho bulkCreate với bookingId
    const roomDetails = rooms.map((room) => ({
      bookingId: booking.id,
      roomCategoryId: room.id,
      quantity: room.quantity,
    }));

    serviceDetails.forEach((service) => {
      service.bookingId = booking.id;
    });

    await db.Booking_detail.bulkCreate(roomDetails);
    await db.Booking_service.bulkCreate(serviceDetails);

    res.status(200).json({
      message: "Đơn đặt đã được lưu thành công.",
      bookingId: booking.id,
    });
  } catch (error) {
    console.error("Lỗi khi lưu đơn đặt:", error);
    res.status(500).json({ error: "Đã xảy ra lỗi khi lưu đơn đặt." });
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
  postOfflineBooking,
};
