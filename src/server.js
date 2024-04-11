import express from 'express';
import 'dotenv/config';
import configViewengine from './configs/viewEngine';
import initWebRoutes from './routes/web';

const app = express();
const PORT = process.env.PORT || 8080;

app.use(express.urlencoded({extended: true}));
app.use(express.json());

configViewengine(app);

initWebRoutes(app);


app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`)
  })