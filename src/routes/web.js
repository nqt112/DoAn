import express from 'express';
import homeController from '../controller/homeController';

const router = express.Router();

const initWebRoutes = (app) => {
    router.get('/',homeController.getHomePage)

    router.get('/test', (req, res) => {
        return res.send('1')
    })
    return app.use('/', router);
}

export default initWebRoutes; 