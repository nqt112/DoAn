import { validationResult } from "express-validator";
import registerService from "../service/registerService";

let getRegisterPage = (req, res) => {
    return res.render('register.ejs',{
        errors: req.flash("errors"),
    });
}
let createNewUser = async(req, res) => {
    let errorsArr = [];
    let validationErrors = validationResult(req);
    if(!validationErrors.isEmpty()){
        let errors = Object.values(validationErrors.mapped());
        errors.forEach((item) => {
            errorsArr.push(item.msg);
        })
        req.flash("errors", errorsArr);
        return res.redirect('/register')
    }
    try{
        let newUser = {
            fullname: req.body.fullname,
            email: req.body.email,
            phone: req.body.phone,  
            password: req.body.password,
        }
        await registerService.createNewUser(newUser);
        return res.redirect('/login')

    }catch(e){
        req.flash("errors", e);
        return res.redirect('/register')
    }
}
module.exports = {
    getRegisterPage, createNewUser
}