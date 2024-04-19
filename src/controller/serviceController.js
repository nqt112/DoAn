import { where } from 'sequelize';
import db from '../models/index'
import multer from 'multer';
import path from 'path';
import appRoot from 'app-root-path';
const fs = require('fs')

let getCreateServicePage = async (req, res) => {
    return res.render('./service/createService.ejs');
}
let getUpdateServicePage = async (req, res) => {
    let id = req.params.id;
    let service = await db.Service.findOne({
        where: {
            id: id
        }
    })    
    return res.render('./service/updateService.ejs',{service});
}
let getServiceList = async(req, res) => {
    let services = [];
    services = await db.Service.findAll();
    let serviceList = services;
    return res.render('./service/serviceList',{serviceList: serviceList});
}
let createNewService = async (req, res) => {
    let image = req.file? req.file.filename : null;
    let { name, price, description } = req.body;
    try{
        await db.Service.create({
        image: image,
         name: name,
         price: price,
         description:description,
        })
    }catch (err) {
        console.log(err)
    }

    return res.redirect('/admin/service/serviceList')
}
let deleteService = async (req, res) => {
    let id = req.params.id;
    try{
        await db.Service.destroy({
            where:{
                id: id
            },
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/service/serviceList') 
}
let updateService = async (req, res) => {
    let id = req.params.id;
    let { name, price, description } = req.body;
    let image = req.file? req.file.filename : null;
    try {
        // Nếu có file hình ảnh mới được upload
        if (image) {
            // Cập nhật cơ sở dữ liệu với hình ảnh mới
            await db.Service.update({
                name: name,
                price: price,
                description:description,
                image : image,
            }, {
                where: {
                    id: id
                }
            })
        } else {
            // Nếu không có file hình ảnh mới được upload, giữ lại hình ảnh cũ
            await db.Service.update({
                name: name,
                price: price,
                description: description,
            }, {
                where: {
                    id: id
                }
            })
        }
    } catch (err) {
        console.log(err);
    }
    return res.redirect('/admin/service/serviceList')
};
let handleUploadFile = (req, res) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }

}
module.exports = {
    getServiceList, createNewService, deleteService, getCreateServicePage, updateService, getUpdateServicePage,
    handleUploadFile
}