import express from 'express';
import 'dotenv/config';
import configViewengine from './config/viewEngine';
import initWebRoutes from './routes/web';
import connection from "./config/connectDB";
import initAdminRoutes from './routes/routeAdmin';
import cookieParser from 'cookie-parser';
import connectFlash from 'connect-flash';
import session from 'express-session';
import passport from 'passport';


const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

app.use (cookieParser('secret'));

//config session
app.use (session({
  cookie: {maxAge: 480000},
  secret: 'secret',
  resave: true,
  saveUninitialized: false
}))

//enable flash message
app.use(connectFlash());

connection();

configViewengine(app);

app.use(passport.initialize());
app.use(passport.session())

initAdminRoutes(app);

initWebRoutes(app);

app.use((req, res) =>{
  return res.render('404.ejs')
})

app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })