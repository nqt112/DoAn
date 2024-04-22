import {check} from "express-validator";

let validationRegister = [
    check("email", "Email không chính xác").isEmail().trim(),

    check("password", "Mật khẩu không chính xác! Yêu cầu tối thiểu 6 ký tự").isLength({min: 6}),

    check("confirmationPassword", "Xác nhận mật khẩu không chính xác!")
    .custom((value, {req}) => {
        return value === req.body.password
    })
]

module.exports = {
    validationRegister
}