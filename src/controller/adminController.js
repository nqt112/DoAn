import db from '../models/index'


let getAdminPage = (req, res) => {
    return res.render('admin.ejs'); 
}

    
module.exports = {
    getAdminPage
}