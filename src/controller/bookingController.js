import BookingStatusEnum from "../enums/bookingStatusEnum";
import { stringify, v4 as uuidv4 } from "uuid";
import db from "../models/index";
import { where } from "sequelize";
import moment from "moment";

let getRoomBooking = async (req, res) => {
    let categoryList = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest: true,
    });
    return res.render("./roomBooking.ejs", {
        user: req.user,
        categoryList,
    });
};

let postRoomBooking = async (req, res, next) => {
    try {
        const body = req.body;
        const booking = await db.Booking.create({
            userId: req.user.id,
            checkIn: body.checkIn,
            checkOut: body.checkOut,
            total_price: body.total_price,
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

let getBookingList = async(req, res) =>{
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
    let bookings = [];
    bookings = await db.Booking.findAll({
        include: {model: db.User, attributes: ['fullname']},
        raw: true,
        nest:true,
    });
    const formattedBookings = bookings.map(booking => {
        return {
           ...booking,
            total_price: moneyFormat(booking.total_price),
            checkIn: moment(booking.checkIn).format('DD-MM-YYYY'),
            checkOut: moment(booking.checkOut).format('DD-MM-YYYY'),
            createdAt: moment(booking.createdAt).format('DD-MM-YYYY HH:mm:ss')
        };
    });
    let bookingList = formattedBookings;
    return res.render('./booking/bookinglist',{bookingList: bookingList});
}
let getBookingDetailPage = async(req, res) =>{
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
            where: {userId: userId},
            include: [
                {
                    model: db.User,  
                },
             
            ],
            raw:true,
            nest:true,
            group: ['Booking.id']
        });
        const formattedBookings = booking.map(booking => {
            return {
               ...booking,
                total_price: moneyFormat(booking.total_price),
                checkIn: moment(booking.checkIn).format('DD-MM-YYYY'),
                checkOut: moment(booking.checkOut).format('DD-MM-YYYY'),
                createdAt: moment(booking.createdAt).format('DD-MM-YYYY HH:mm:ss')
            };
        });
        
        let bookingList = formattedBookings;
        
        return res.render('./bookingDetail.ejs',{
            user: req.user, bookingList : bookingList
        });
    } catch (error) {
        return res.json(error);
    }
    
}
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
        let  bookingid  = req.params.id;
        // Lấy thông tin các phòng tương ứng với đơn đặt
        const bookingDetail = await db.Booking_detail.findAll({
            where: { bookingId : bookingid }, // Lọc các đơn đặt dựa trên id
            include: [
                {
                    model: db.Room_category,
                    attributes:["id","name","price","numberOfPeople"]
                },
                {
                    model: db.Room,
                    attributes:["id","roomCategoryId","roomNumber","floor"]
                },
            ],
         
            raw: true,
            nest: true,
        });
        const formattedDetail = bookingDetail.map(booking => {
            return {
               ...booking,
                price: moneyFormat(booking.Room_category.price)
            };
        });
        let bookingDetailList = formattedDetail;
        return res.json(bookingDetailList)
    } catch (error) {
        return res.json(error);
    }
}
let getServiceList = async (req, res)=>{
    try{
        const serviceList = await db.Service.findAll({
            attributes:["id","name","price"],
            raw: true,
            nest: true,
        })
        return res.json(serviceList);
    }
    catch (error) {
        return res.json(error);
    }

}
module.exports = {
    getRoomBooking,
    postRoomBooking,
    getBookingList,
    getBookingDetailPage, getModalDetail,
    getServiceList
};
