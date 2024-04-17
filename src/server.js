import express from 'express';
import 'dotenv/config';
import configViewengine from './config/viewEngine';
import initWebRoutes from './routes/web';
import connection from "./config/connectDB";
import initAdminRoutes from './routes/routeAdmin';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

connection();

configViewengine(app);

initAdminRoutes(app);

initWebRoutes(app);

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })