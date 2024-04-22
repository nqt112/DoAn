import db from "../models/index";
import bcryptjs from "bcryptjs";

let createNewUser = async (user) => {
    return new Promise(async (resolve, reject) => {
        try{
            //check email exist
            let check = await checkEmailExist(user.email);
            if(check){
                reject(`Email "${user.email}" đã tồn tại. Vui lòng chọn Email khác!`)
            }else {
                //hash password
                let salt = await bcryptjs.genSalt(10);
                let hashPassword = await bcryptjs.hashSync(user.password, salt);
                user.password = hashPassword;
                let data = {
                    username: user.username,
                    password: hashPassword,
                    fullname: user.fullname,
                    email: user.email,
                    phone: user.phone,
                    role: 1
                }
                resolve(await db.User.create({
                    ...data
                }));
            }
        }
        catch(e){
            reject(e);
        }
    })
}
let checkEmailExist = async(email) => {
    try{
        return await db.User.findOne({
            where: {
              email: email
            }
          }).then(user => {
            if (user) {
              return true;
            } else {
              return false;
            }
          }); 
    }catch(err){
        console.log(err)
    }
}
module.exports = {
    createNewUser,
};