import db from "../models/index";

let getRoomBooking = async (req, res) => {
    let categoryList = await db.Room_category.findAll({
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest:true,
        
    })
    let count = await db.Room.count({
        where:{
            roomCategoryId: 2,
            status : "Trống",
        }
    })
    return res.render('./roomBooking.ejs',{
        user: req.user, categoryList, count
    });
}
let getService = async (req, res) => {
    let serviceList = await db.Service.findAll({
        
    })
    return res.render('./service.ejs',{
        user: req.user,serviceList: serviceList});
}
module.exports = {
    getRoomBooking, getService
}