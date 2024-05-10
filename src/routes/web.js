import express from "express";
import homeController from "../controller/homeController";
import loginController from "../controller/loginController";
import registerController from "../controller/registerController";
import auth from "../middleware/authValidation";
import passport from "passport";
import initPassportLocal from "../controller/passportController";
import bookingController from "../controller/bookingController";
import db from "../models/index";
const router = express.Router();

initPassportLocal();

const initWebRoutes = (app) => {
    router.get("/", homeController.getHomePage);
    router.get(
        "/login",
        loginController.checkLoggedOut,
        loginController.getLoginPage
    );
    router.get("/roomDetail/:id", homeController.getRoomDetail);

    router.get(
        "/userDetail/:id",
        loginController.checkLoggedIn,
        homeController.getUserDetailPage
    );
    router.get(
        "/userDetail/",
        loginController.checkLoggedIn,
        homeController.getDetailPage
    );
    router.post("/postUserDetail/:id", homeController.postUserDetail);

    router.post(
        "/login",
        passport.authenticate("local", {
            failureRedirect: "/login",
            successFlash: true,
            failureFlash: true,
            // successRedirect: '/',
        }),
        loginController.postLogin
    ),
        router.get("/register", registerController.getRegisterPage);
    router.post(
        "/register",
        auth.validationRegister,
        registerController.createNewUser
    );

    router.post("/logout", loginController.postLogout);

    router.get(
        "/roomBooking",
        loginController.checkLoggedIn,
        bookingController.getRoomBooking
    );

    router.post(
        "/roomBooking",
        loginController.checkLoggedIn,
        bookingController.postRoomBooking
    );
    router.get(
        "/bookingDetail/",
        loginController.checkLoggedIn,
        bookingController.getBookingDetailPage
    );
    router.get("/bookingDetail/:id", bookingController.getModalDetail)

    router.get("/api/serviceList", bookingController.getServiceList)    

    router.post("/api/bookingService",bookingController.postBookingService)

    // câu truy vấn test lấy ra dữ liệu booking cùng booking detail và các bảng liên quan.
    router.get("/roomBooking/:id", async (req, res) => {
        const id = req.params.id;
        try {
            const booking = await db.Booking.findByPk(id, {
                include: [
                    {
                        model: db.Booking_detail,
                        attributes: {
                            exclude: ["bookingDetailId"],
                        },
                    },
                    {
                        model: db.User,
                    },
                ],
                attributes: {
                    exclude: ["bookingId"],
                },
            });
            return res.json(booking);
        } catch (error) {
            return res.json(error);
        }
    });

    return app.use("/", router);
};

export default initWebRoutes;
