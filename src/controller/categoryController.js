import { where } from 'sequelize';
import db from '../models/index'
import multer from 'multer';



let getCreateCategoryPage = async (req, res) => {
    return res.render('./category/createCategory.ejs');
}
let getUpdateCategoryPage = async (req, res) => {
    let id = req.params.id;
    let category = await db.Room_category.findOne({
        where: {
            id: id
        }
    })    
    return res.render('./category/updateCategory.ejs',{category});
}
let getCategoryList = async(req, res) => {
    let categorys = [];
    categorys = await db.Room_category.findAll();
    let categoryList = categorys;
    return res.render('./category/categoryList',{categoryList: categoryList});
}
let createNewCategory = async (req, res) => {
    let image = req.file.filename;
    let { name, square, numberOfPeople, typeOfBed, price, description } = req.body;
    try{
        await db.Room_category.create({
         name: name,
         square: square,
         numberOfPeople: numberOfPeople,
         typeOfBed: typeOfBed,
         price: price,
         description:description,
         image: image
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/category/categoryList')
}
let deleteCategory = async (req, res) => {
    let id = req.params.id;
    try{
        await db.Room_category.destroy({
            where:{
                id: id
            },
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/category/categoryList') 
}
let updateCategory = async (req, res) => {
    let id = req.params.id;
    let { name, square, numberOfPeople, typeOfBed, price, description, image } = req.body;
    try{
        await db.Room_category.update({
        name: name,
         square: square,
         numberOfPeople: numberOfPeople,
         typeOfBed: typeOfBed,
         price: price,
         description:description,
         image: image
        },{
            where: {
                id: id
            }
        })
    }catch (err) {
        console.log(err)
    }
    return res.redirect('/admin/category/categoryList')
}
let handleUploadFile = (req, res) => {
        if (req.fileValidationError) {
            return res.send(req.fileValidationError);
        }
        else if (!req.file) {
            return res.send('Please select an image to upload');
        }
        //res.send(`You have uploaded this image: <hr/><img src="${req.file.filename}" width="500"><hr /><a href="./">Upload another image</a>`);

}
module.exports = {
    getCategoryList, createNewCategory, deleteCategory, getCreateCategoryPage, updateCategory, getUpdateCategoryPage,
    handleUploadFile
}