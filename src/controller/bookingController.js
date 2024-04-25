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
    console.log(count)
    return res.render('./roomBooking.ejs',{
        user: req.user, categoryList, count
    });
}

module.exports = {
    getRoomBooking
}