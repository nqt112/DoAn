import db from '../models/index'
import bcryptjs from "bcryptjs";

let getCreateUserPage = async (req, res) => {
    return res.render('./user/createUser.ejs',{
        errors: req.flash("errors"),
    });
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
    let { username, password, fullname, email, phone, role ,createdAt} = req.body;

    // Kiểm tra xem email đã tồn tại trong cơ sở dữ liệu chưa
    let emailExists = await checkEmailExist(email);
    if (emailExists) {
        req.flash('errors', `Email "${email}" đã tồn tại. Vui lòng chọn Email khác!!`);
        return res.redirect('/admin/user/createUser');
    }

    // Mã hóa mật khẩu
    let salt = await bcryptjs.genSalt(10);
    let hashPassword = await bcryptjs.hash(password, salt);

    try {
        // Tạo người dùng mới
        await db.User.create({
            username: username,
            password: hashPassword,
            fullname: fullname,
            email: email,
            phone: phone,
            role: role,
            createdAt: createdAt
        });
        return res.redirect('/admin/user/userlist');
    } catch (err) {
        console.log(err);
        req.flash('errors', 'Đã xảy ra lỗi trong quá trình tạo người dùng mới');
        return res.redirect('/admin/user/userlist');
    }
};

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
    let { username, password, fullname, email, phone, role, createdAt } = req.body;

    try {
        // Check if the password is provided for update
        let updateFields = {
            username: username,
            fullname: fullname,
            email: email,
            phone: phone,
            role: role,
            createdAt: createdAt
        };

        // Check if the password field is not empty
        if (password) {
            // If password is provided, generate hash
            let salt = await bcryptjs.genSalt(10);
            let hashPassword = await bcryptjs.hash(password, salt);
            // Add hashed password to the update fields
            updateFields.password = hashPassword;
        }

        // Find the user by id and update the fields
        await db.User.update(updateFields, {
            where: {
                id: req.params.id
            }
        });
        
        return res.redirect('/admin/user/userlist');
    } catch (err) {
        console.log(err);
        req.flash('errors', 'Đã xảy ra lỗi trong quá trình cập nhật người dùng');
        return res.redirect('/admin/user/userlist');
    }
};


// let updateUser = async (req, res) => {
//     let id = req.params.id;
//     let { username, password, fullname, email, phone, role } = req.body;
//     try{
//         await db.User.update({
//             username: username,
//             password: password,
//             fullname: fullname,
//             email: email,
//             phone: phone,
//             role: role
//         },{
//             where: {
//                 id: id
//             }
//         })
//     }catch (err) {
//         console.log(err)
//     }
//     return res.redirect('/admin/user/userlist')
// }
module.exports = {
    getUserList, createNewUser, deleteUser, getCreateUserPage, updateUser, getUpdateUserPage, checkEmailExist
}