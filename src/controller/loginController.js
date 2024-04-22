import db from "../models/index";

let getLoginPage = (req, res) => {
    return res.render('login.ejs',{
        errors: req.flash("errors"),
    });
}
let getRegisterPage = (req, res) => {
    return res.render('register.ejs');
}
let checkLoggedIn = async(req, res, next) => {
    if(!req.isAuthenticated()){
        return res.redirect("/login");
    }
    next();
}
let checkLoggedOut = (req, res, next) => {
    if(req.isAuthenticated()){
        return res.redirect('/');
    }
    next();
}
let postLogout = (req, res) => {
    req.session.destroy((err) =>{
        return res.redirect("/");
    })
}
let postLogin = async (req, res) => {
    try {
        // Tìm người dùng với email đã cung cấp
        let user = await db.User.findOne({
            where: {
                email: req.body.email
            }
        });

        // Kiểm tra xem người dùng có tồn tại không
        if (!user) {
            return res.redirect('/login');
        }

        // Kiểm tra vai trò của người dùng và điều hướng tới trang tương ứng
        if (user.role === false) {
            return res.redirect('/admin');
        } else if (user.role === true) {
            return res.redirect('/');
        } else {
            // Nếu vai trò không được xác định, điều hướng lại đến trang đăng nhập
            return res.redirect('/login');
        }
    } catch (error) {
        console.error("Error:", error);
        return res.redirect('/login');
    }
};
module.exports = {
    getLoginPage, getRegisterPage, checkLoggedIn, checkLoggedOut, postLogout, postLogin
}