import adminController from '../controller/adminController';
import userController from '../controller/userController';
import categoryController from '../controller/categoryController';
import express from 'express';
import appRoot from 'app-root-path';
import path from 'path';
import multer from 'multer';
const router = express.Router();

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, appRoot + '/src/public/image/category/');
    },
    // By default, multer removes file extensions so let's add them back
    filename: function(req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
});
const imageFilter = function(req, file, cb) {
    if (!file.originalname.match(/\.(jpg|JPG|jpeg|JPEG|png|PNG|gif|GIF)$/)) {
        req.fileValidationError = 'Only image files are allowed!';
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
let upload = multer({ storage: storage, fileFilter: imageFilter });

const initAdminRoutes = (app) => {
    router.get('/',adminController.getAdminPage)
    
    router.get('/user/userlist',userController.getUserList)
    router.post('/user/create-new-user',userController.createNewUser)
    router.post('/user/delete-user/:id', userController.deleteUser)
    router.get('/user/createUser/', userController.getCreateUserPage)
    router.get('/user/updateUser/:id', userController.getUpdateUserPage)
    router.post('/user/update-user/:id', userController.updateUser)

    router.get('/category/categorylist',categoryController.getCategoryList)
    router.post('/category/create-new-category',upload.single('image'),categoryController.createNewCategory)
    router.post('/category/delete-category/:id', categoryController.deleteCategory)
    router.get('/category/createcategory/', categoryController.getCreateCategoryPage)
    router.get('/category/updatecategory/:id', categoryController.getUpdateCategoryPage)
    router.post('/category/update-category/:id', categoryController.updateCategory)

    router.get('/test', (req, res) => {
        return res.render('./user/createUser.ejs')
    })
    return app.use('/admin', router);
}

export default initAdminRoutes; 