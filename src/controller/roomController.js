import { where } from 'sequelize';
import db from '../models/index'
import { name } from 'ejs';

let getCreateRoomPage = async (req, res) => {
    let categoryList = await db.Room_category.findAll({
        attributes: ['id','name'],
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest:true,
    })
    return res.render('./room/createRoom.ejs',{categoryList: categoryList});
}
let getUpdateRoomPage = async (req, res) => {
    let id = req.params.id;
    let categoryList = await db.Room_category.findAll({
        attributes: ['id','name'],
        // include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest:true,
    })
    let room = await db.Room.findOne({
        where: {
            id: id
        }
    })    
    return res.render('./room/updateRoom.ejs',{room, categoryList});
}
let getRoomList = async(req, res) => {
    let rooms = [];
    rooms = await db.Room.findAll({
        //attributes: ['id','roomCategoryId','roomNumber'],
        include: {model: db.Room_category, attributes: ['id','name'],},
        raw: true,
        nest:true,
    })
    let roomList = rooms;
    return res.render('./room/roomlist.ejs',{roomList: roomList});
}
let createNewRoom = async (req, res) => {
    let { roomCategoryId, roomNumber, floor, status} = req.body;
    try{
        await db.Room.create({
            roomCategoryId: roomCategoryId,
            roomNumber: roomNumber,
            floor: floor,
            status: status
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/room/roomlist')
}
let deleteRoom = async (req, res) => {
    let id = req.params.id;
    try{
        await db.Room.destroy({
            where:{
                id: id
            },
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/room/roomlist') 
}
let updateRoom = async (req, res) => {
    let id = req.params.id;
    let { roomCategoryId, roomNumber, floor, status} = req.body;
    try{
        await db.Room.update({
           roomCategoryId: roomCategoryId,
           roomNumber: roomNumber,
           floor: floor,
           status: status
        },{
            where: {
                id: id
            }
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/room/roomlist')
}
module.exports = {
    getRoomList, createNewRoom, deleteRoom, getCreateRoomPage, updateRoom, getUpdateRoomPage
}