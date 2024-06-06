import db from "../models/index";
import bcryptjs from 'bcryptjs';

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
let getHomePage = async(req, res) => {
    let category = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest:true,
    })
    const categoryList = category.map((booking) => {
        return {
          ...booking,
          price: moneyFormat(booking.price),
        };
      });
      let service = await db.Service.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        attributes: ['id','name','description','image'],
        raw: true,
        nest:true,
    })
    return res.render('home.ejs', {
        user: req.user, categoryList, service
    });
}
let getDetailPage = async (req, res) => {
    return res.render('./userDetail.ejs');   
}
let getUserDetailPage = async(req, res) => {
    let id = req.params.id;
    let user = await db.User.findOne({
        where: {
            id: id
        }
    })  
    return res.render('./userDetail.ejs', {user: user});
}
let postUserDetail = async (req, res) => {
    let id = req.params.id;
    let { password, fullname, email, phone } = req.body;

    try {
        let updateData = {
            fullname: fullname,
            email: email,
            phone: phone,
        };

        if (password) {
            let salt = await bcryptjs.genSalt(10);
            let hashPassword = await bcryptjs.hash(password, salt);
            updateData.password = hashPassword;
        }

        await db.User.update(updateData, {
            where: {
                id: id
            }
        });

    } catch (err) {
        console.log(err);
    }

    return res.redirect('/');
}
let getRoomDetail = async (req, res) => {
    let id = req.params.id;
    let category = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        where: {id: id},
        raw: true,
        nest:true,
    })
    const categoryList = category.map((booking) => {
        return {
          ...booking,
          price: moneyFormat(booking.price),
        };
      });
    return res.render('./roomDetail.ejs',{
        user: req.user, categoryList: categoryList});
}

module.exports = {
    getHomePage, postUserDetail, getUserDetailPage, getDetailPage, getRoomDetail
}