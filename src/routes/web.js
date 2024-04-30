import express from 'express';
import homeController from '../controller/homeController';
import loginController from '../controller/loginController';
import registerController from '../controller/registerController';
import auth from '../middleware/authValidation';
import passport from 'passport';
import initPassportLocal from '../controller/passportController';
import bookingController from '../controller/bookingController';
import db from '../models/index';
const router = express.Router();

initPassportLocal();

const initWebRoutes = (app) => {
    router.get('/', homeController.getHomePage)
    router.get('/login',loginController.checkLoggedOut, loginController.getLoginPage)
    router.get('/roomDetail/:id', homeController.getRoomDetail)
    
    router.get('/userDetail/:id',loginController.checkLoggedIn, homeController.getUserDetailPage)
    router.get('/userDetail/',loginController.checkLoggedIn,homeController.getDetailPage)
    router.post('/postUserDetail/:id', homeController.postUserDetail)
    
    router.post('/login' ,passport.authenticate('local', {
        failureRedirect: '/login',
        successFlash: true,
        failureFlash: true,
        // successRedirect: '/',
    }),loginController.postLogin
), 
    router.get('/register',registerController.getRegisterPage)
    router.post('/register',auth.validationRegister ,registerController.createNewUser)

    router.post('/logout',loginController.postLogout)

    router.get('/roomBooking', bookingController.getRoomBooking)

    router.get('/service', bookingController.getService)

    router.get('/test', (req, res) => {
        return res.send('1')
    })
    return app.use('/', router);
}

export default initWebRoutes; 