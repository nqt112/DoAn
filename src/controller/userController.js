import { where } from 'sequelize';
import db from '../models/index'

let getCreateUserPage = async (req, res) => {
    return res.render('./user/createUser.ejs');
}
let getUpdateUserPage = async (req, res) => {
    let id = req.params.id;
    let user = await db.User.findOne({
        where: {
            id: id
        }
    })    
    return res.render('./user/updateUser.ejs',{user});
}
let getUserList = async(req, res) => {
    let users = [];
    users = await db.User.findAll();
    let userList = users;
    return res.render('./user/userlist.ejs',{userList: userList});
}
let createNewUser = async (req, res) => {
    let { username, password, fullname, email, phone, role } = req.body;
    try{
        await db.User.create({
            username: username,
            password: password,
            fullname: fullname,
            email: email,
            phone: phone,
            role: role
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/user/userlist')
}
let deleteUser = async (req, res) => {
    let id = req.params.id;
    try{
        await db.User.destroy({
            where:{
                id: id
            },
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/user/userlist') 
}
let updateUser = async (req, res) => {
    let id = req.params.id;
    let { username, password, fullname, email, phone, role } = req.body;
    try{
        await db.User.update({
            username: username,
            password: password,
            fullname: fullname,
            email: email,
            phone: phone,
            role: role
        },{
            where: {
                id: id
            }
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/user/userlist')
}
module.exports = {
    getUserList, createNewUser, deleteUser, getCreateUserPage, updateUser, getUpdateUserPage
}