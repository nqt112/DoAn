import db from "../models/index";
import bcryptjs from "bcryptjs";

let findUserByEmail = async (email) => {
    return new Promise(async (resolve, reject) => {
        try{
            resolve(await db.User.findOne({
                where: {
                  email: email
                }
              }).then(email => {
                if (email) {
                  return email;
                } else {
                  return null;
                }
              }) 
            )
        }catch(err){
            reject(err)
        }
    })
}
let comparePassword = async (user, password) => {
    return new Promise(async(resolve, reject) => {
        try{
            let isMatch = bcryptjs.compareSync(password, user.password);
            if(isMatch) resolve (true);
            resolve("Mật khẩu sai");
        }catch(err){
            reject(err);
        }
   
    })
}
let findUserById = async (id) => {
    return new Promise(async (resolve, reject) => {
        try{
            resolve(await db.User.findOne({
                where: {
                  id: id
                }
              }).then(id => {
                if (id) {
                  return id;
                } else {
                  return null;
                }
              }) 
            )
        }catch(err){
            reject(err)
        }
    })
}
module.exports = {
    findUserByEmail, comparePassword, findUserById
}