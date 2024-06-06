const db = require("../models/index");
const { jsPDF } = require('jspdf');
const moment = require('moment');
require('jspdf-autotable');
const path = require('path');
import BookingStatusEnum from '../enums/bookingStatusEnum.js';
import RobotoBold from '../public/js/Roboto-Bold.js'
import RobotoRegular from '../public/js/Roboto-Regular.js'
import { where } from 'sequelize';
const { Sequelize, Op } = require('sequelize');
const { v4: uuidv4 } = require('uuid');
const ExcelJS = require('exceljs');

const moneyFormat = (money) => {
    if (isNaN(money)) {
        return "0 ₫";
    }
    const formatter = new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND",
    });
    return formatter.format(money);
};
let getOverviewPage = async(req, res) =>{

    return res.render('overView.ejs'); 
}
let getExportInvoicePage = async (req, res) =>{

    return res.render('./booking/exportInvoice.ejs')
}

const printInvoice = async (req, res, next) => {
    try {
        const { bookingId } = req.params;

        // Kiểm tra xem hoá đơn đã được in chưa
        // const existingInvoice = await db.Export_invoice.findOne({ where: { BookingId: bookingId } });
        // if (existingInvoice) {
        //     res.send('Hoá đơn đã được in trước đó!');
        //     return;
        // }

        // Lấy thông tin chi tiết đặt phòng và thông tin người dùng
        const bookingDetail = await db.Booking_detail.findAll({
            where: { bookingId: bookingId },
            include: [
                {
                    model: db.Room_category,
                    attributes: ["id", "name", "price", "numberOfPeople"]
                },
                {
                    model: db.Room,
                    attributes: ["id", "roomCategoryId", "roomNumber", "floor"]
                },
                {
                    model: db.Booking,
                    attributes: ["id", "total_price", "checkIn", "checkOut", "userId", "code"],
                    include: [
                        {
                            model: db.User,
                            attributes: ["id", "fullname", "email"],
                        },
                        {
                            model: db.Export_invoice,
                            attributes: ["bookingId","invoice_code"]
                        }
                    ]
                }
            ],
            raw: true,
            nest: true,
        });

        // Lấy thông tin dịch vụ
        const serviceDetail = await db.Booking_service.findAll({
            where: { bookingId: bookingId },
            include: [
                {
                    model: db.Service,
                    attributes: ["id", "name", "price"]
                },
            ],
            raw: true,
            nest: true,
        });

        // Lấy thông tin người dùng từ chi tiết đặt phòng
        const user = bookingDetail[0].Booking.User;
        const { fullname, email } = user;
        const { checkIn, checkOut, code } = bookingDetail[0].Booking;
        const invoiceId =  bookingDetail[0].Booking.Export_invoice.invoice_code;

        // Tính tổng tiền phòng từ giá trị total_price của Booking
        const totalRoomPrice = bookingDetail.reduce((acc, room) => room.Booking.total_price, 0);

        // Tính tổng tiền dịch vụ
        const totalServicePrice = serviceDetail.reduce((acc, service) => acc + service.Service.price * service.quantity, 0);

        // Tạo UUID cho hoá đơn
        

        // Tạo tài liệu PDF
        const doc = new jsPDF({
            font: 'Roboto'
        });

        // Add the custom fonts
        doc.addFileToVFS('Roboto-Regular.ttf', RobotoRegular);
        doc.addFileToVFS('Roboto-Bold.ttf', RobotoBold);
        doc.addFont('Roboto-Regular.ttf', 'Roboto', 'normal');
        doc.addFont('Roboto-Bold.ttf', 'Roboto', 'bold');

        // Set the custom font
        doc.setFont('Roboto', 'normal'); // Sử dụng Roboto Regular cho văn bản thông thường
        doc.setFontSize(12);

        // Lấy ngày hiện tại để thêm vào hóa đơn
        const currentDate = moment().format('DD-MM-YYYY');

        // Thêm tiêu đề hóa đơn
        doc.setFontSize(16);
        doc.setFont('Roboto', 'bold');
        doc.text('Thông tin chi tiết hóa đơn', doc.internal.pageSize.getWidth() / 2, 10, { align: 'center' });

        // Thêm thông tin ngày in hóa đơn
        doc.setFontSize(12);
        doc.setFont('Roboto', 'normal');

        // X-coordinate for right-aligned text
        const rightAlignX = doc.internal.pageSize.getWidth() - 10; // 10 units from the right edge

        // Thêm thông tin người dùng và thời gian
        doc.text(`Tên khách hàng: ${fullname}`, 10, 20);
        doc.text(`Email: ${email}`, 10, 30);
        doc.text(`Ngày in hóa đơn: ${currentDate}`, rightAlignX, 20, { align: 'right' });
        doc.text(`Ngày check-in: ${moment(checkIn).format('DD-MM-YYYY')}`, rightAlignX, 30, { align: 'right' });
        doc.text(`Ngày check-out: ${moment(checkOut).format('DD-MM-YYYY')}`, rightAlignX, 40, { align: 'right' });
        doc.text(`Mã đặt phòng: ${code}`, 10, 40);
        doc.text(`Mã hóa đơn: ${invoiceId}`, 10, 50);  // Thêm mã hóa đơn

        // Add room details
        doc.setFontSize(12);
        doc.setFont('Roboto', 'bold');
        doc.text("Thông tin phòng đặt:", 10, 80);
        doc.setFontSize(13);
        doc.setFont('Roboto', 'normal');
        const roomHeaders = ['Loại phòng', 'Số người tối đa', 'Giá', 'Số lượng'];
        const roomData = bookingDetail.map(room => [room.Room_category.name, room.Room_category.numberOfPeople, moneyFormat(room.Room_category.price), room.quantity]);
        doc.autoTable({
            font: 'Roboto',
            startY: 85,
            margin: { top: 10 },
            head: [roomHeaders],
            body: roomData,
            theme: 'striped',
            styles: { cellPadding: 1, fontSize: 10, font: 'Roboto' },
        });

        // Add total room price
        const roomTotalY = doc.autoTable.previous.finalY + 10;
        doc.text(`Tổng tiền phòng: ${moneyFormat(totalRoomPrice)}`, 10, roomTotalY);
        doc.setFontSize(13);
        doc.setFont('Roboto', 'bold');
        // Add service details
        doc.text("Thông tin dịch vụ:", 10, roomTotalY + 10);
        doc.setFontSize(12);
        doc.setFont('Roboto', 'normal');
        const serviceHeaders = ['Tên dịch vụ', 'Giá', 'Số lượng'];
        const serviceData = serviceDetail.map(service => [service.Service.name, moneyFormat(service.Service.price), service.quantity]);
        doc.autoTable({
            startY: roomTotalY + 15,
            margin: { top: 10 },
            head: [serviceHeaders],
            body: serviceData,
            theme: 'striped',
            styles: { cellPadding: 1, fontSize: 10, font: 'Roboto' },
        });

        // Add total service price
        const serviceTotalY = doc.autoTable.previous.finalY + 10;
        doc.text(`Tổng tiền dịch vụ: ${moneyFormat(totalServicePrice)}`, 10, serviceTotalY);

        // Tổng cộng
        doc.text(`Tổng cộng: ${moneyFormat(totalRoomPrice + totalServicePrice)}`, 10, serviceTotalY + 10);

        // Lưu hoặc hiển thị tài liệu
        const shortCode = invoiceId.substring(0, 8); // Lấy 8 ký tự đầu từ mã đặt phòng
        const fileName = `invoice_${shortCode}.pdf`; // Đặt tên hóa đơn với 8 ký tự đầu của mã đặt phòng
        const filePath = path.join('./src/invoicePDF/', fileName); // Điều chỉnh đường dẫn thư mục theo nhu cầu
        doc.save(filePath);
        res.download(filePath, (err) => {
            if (err) {
                console.error('Lỗi lưu file:', err);
                next(err);
            }
        });
        // Lưu thông tin hoá đơn vào bảng export_invoice
        // await db.Export_invoice.create({
        //     bookingId: bookingId,
        //     invoice_code: invoiceId,
        //     total_price: totalRoomPrice + totalServicePrice,
        //     export_day: moment().format('YYYY-MM-DD')  // Định dạng ngày xuất hóa đơn theo định dạng ngày
        // });

    } catch (error) {
        console.error(error);
        res.status(500).send('Đã xảy ra lỗi trong quá trình in hóa đơn');
    }
};

// let getRevenueMonthly = async (req, res) => {
//     try {
//         const bookings = await db.Booking.findAll({
//             include: [
//                 {
//                     model: db.Booking_service,
//                     attributes: ["id", "total_price"]
//                 }
//             ],
//             where: {
//                 status: BookingStatusEnum.CHECKOUT // Only consider checked out bookings
//             }
//         });

//         // Calculate the total revenue per month
//         const revenueByMonth = bookings.reduce((acc, booking) => {
//             const month = new Date(booking.createdAt).getMonth() + 1;
//             let additionalPrice = 0;

//             if (Array.isArray(booking.Booking_services)) {
//                 additionalPrice = booking.Booking_services.reduce((serviceAcc, service) => {
//                     // Calculate the price for each service and add to the accumulator
//                     return serviceAcc + service.total_price;
//                 }, 0);
//             }
//             const totalPrice = booking.total_price + additionalPrice;

//             if (!acc[month]) {
//                 acc[month] = 0;
//             }
//             acc[month] += totalPrice;

//             return acc;
//         }, {});

//         // Format the result as an array of objects
//         const formattedResult = Object.keys(revenueByMonth).map(month => ({
//             month: parseInt(month, 10),
//             totalRevenue: revenueByMonth[month]
//         }));

//         res.json(formattedResult);
//     } catch (error) {
//         res.status(500).send(error.message);
//     }
// }
let getRevenueMonthly = async (req, res) => {
    try {
        const monthlyRevenue = await db.Export_invoice.findAll({
            attributes: [
                [Sequelize.fn('MONTH', Sequelize.col('Export_day')), 'month'],
                [Sequelize.fn('SUM', Sequelize.col('Total_price')), 'totalRevenue']
            ],
            group: [Sequelize.fn('MONTH', Sequelize.col('Export_day'))]
        });
        res.json(monthlyRevenue);
    } catch (error) {
        res.status(500).send(error.message);
    }
}


let getRevenueYearly = async (req, res) =>{
    try {
        const yearlyRevenue = await db.Export_invoice.findAll({
            attributes: [
                [Sequelize.fn('YEAR', Sequelize.col('Export_day')), 'year'],
                [Sequelize.fn('SUM', Sequelize.col('Total_price')), 'totalRevenue']
            ],
            group: [Sequelize.fn('YEAR', Sequelize.col('Export_day'))]
        });
        res.json(yearlyRevenue);
    } catch (error) {
        res.status(500).send(error.message);
    }
}

const getRevenueDate = async (req, res) => {
    try {
        const { month } = req.query;
        const startDate = new Date(`${new Date().getFullYear()}-${month}-01`); // Ngày đầu tiên của tháng
        const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0); // Ngày cuối cùng của tháng

        const dateRangeRevenue = await db.Export_invoice.findAll({
            attributes: [
                'Export_day',
                [Sequelize.fn('SUM', Sequelize.col('Total_price')), 'totalRevenue']
            ],
            where: {
                Export_day: {
                    [Sequelize.Op.between]: [startDate, endDate] // Lọc theo ngày trong tháng
                }
            },
            group: ['Export_day'],
            order: [['Export_day', 'ASC']] // Đảm bảo kết quả được sắp xếp theo ngày
        });
        res.json(dateRangeRevenue);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
const getRoomCategoryBookingCount = async (req, res) => {
    try {
        const roomCategoryBookingCount = await db.Booking_detail.findAll({
            attributes: [
                'RoomCategoryId',
                [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity'] // Thay vì COUNT, sử dụng SUM để tính tổng số lượng
            ],
            group: ['RoomCategoryId'],
            include: [
                {
                    model: db.Room_category,
                    attributes: ['id', 'name']
                }
            ]
        });
        res.json(roomCategoryBookingCount);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
const getServiceBookingCount = async (req, res) => {
    try {
        const getServiceBookingCount = await db.Booking_service.findAll({
            attributes: [
                'ServiceId',
                [Sequelize.fn('SUM', Sequelize.col('Quantity')), 'totalQuantity']
            ],
            group: ['ServiceId'],
            include: [
                {
                    model: db.Service,
                    attributes: ['id', 'name']
                }
            ]
        });
        res.json(getServiceBookingCount);
    } catch (error) {
        res.status(500).send(error.message);
    }
};
let fetchInvoices = async (startDate, endDate) => {
    let dateFilter = {};
    if (startDate && endDate) {
        dateFilter = {
            export_day: {
                 [Op.between]: [moment(startDate).startOf('day').toISOString(), moment(endDate).endOf('day').toISOString()] 
            }
        };
    }
    try {
        const invoices = await db.Export_invoice.findAll({
            where: dateFilter,
            include: [
                {
                    model: db.Booking,
                    attributes: ["id", "userId", "code"],
                    include: [{
                        model: db.User,
                        attributes: ["id", "fullname"]
                    }]
                }
            ]
        });
        return invoices;
    } catch (error) {
        throw new Error(error.message);
    }
};
let getExportInvoice = async (req, res) =>{
    const { startDate, endDate } = req.query;
    try {
        const invoices = await fetchInvoices(startDate, endDate);
        res.json(invoices);
    } catch (error) {
        res.status(500).send(error.message);
    }
}


let exportInvoiceToExcel = async (req, res) => {
    const { startDate, endDate } = req.query;
    try {
        const invoices = await fetchInvoices(startDate, endDate);
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Invoices');

        worksheet.columns = [
            { header: 'Mã hoá đơn', key: 'invoice_code', width: 40 },
            { header: 'Mã đơn đặt', key: 'booking_code', width: 40 },
            { header: 'Khách hàng', key: 'fullname', width: 20 },
            { header: 'Tổng tiền', key: 'total_price', width: 15 },
            { header: 'Ngày xuất', key: 'export_day', width: 20 },
        ];
        
        // Định dạng đậm cho header
        worksheet.getRow(1).font = { bold: true };          

        invoices.forEach(invoice => {
            const booking = invoice.Booking;
            const user = booking.User;
            const formattedPrice = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(invoice.total_price);
            const formatExportDay = moment(invoice.export_day).format('DD-MM-YYYY')
            worksheet.addRow({
                invoice_code: invoice.invoice_code,
                booking_code: invoice.Booking.code,
                fullname: user.fullname,
                total_price: formattedPrice,
                export_day: formatExportDay
            });
        });
        const exportDate = new Date();
        const year = exportDate.getFullYear();
        const month = (exportDate.getMonth() + 1).toString().padStart(2, '0');
        const day = exportDate.getDate().toString().padStart(2, '0');
        const exportDay = `${year}-${month}-${day}`;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=invoices_${exportDay}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).send(error.message);
    }
};

module.exports = {
    printInvoice, getOverviewPage,
    getRevenueMonthly, getRevenueYearly,
    getRevenueDate,
    getRoomCategoryBookingCount, getServiceBookingCount,
    getExportInvoice, getExportInvoicePage,
    exportInvoiceToExcel
};
