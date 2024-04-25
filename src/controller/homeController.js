import db from "../models/index";
import bcryptjs from 'bcryptjs';

let getHomePage = async(req, res) => {
    let categoryList = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest:true,
    })
    return res.render('home.ejs', {
        user: req.user, categoryList
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
    let categoryList = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        where: {id: id},
        raw: true,
        nest:true,
    })
    return res.render('./roomDetail.ejs',{
        user: req.user, categoryList: categoryList});
}




module.exports = {
    getHomePage, postUserDetail, getUserDetailPage, getDetailPage, getRoomDetail
}