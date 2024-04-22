import passport from "passport";
import passportLocal from "passport-local";
import loginService from "../service/loginService";

let LocalStrategy = passportLocal.Strategy;

let initPassportLocal = () => {
    passport.use(new LocalStrategy({
        usernameField: 'email',
        passwordField: 'password',
        passReqToCallback: true,
    },
    async (req, email, password, done) => {
        try{
            let user = await loginService.findUserByEmail(email);
            if(!user){
                return done(null, false, req.flash('errors', `Email "${email}" không tồn tại!`));
            }
            if(user){
                //compare password
                let match = await loginService.comparePassword(user, password);
                if(match === true){
                    return done(null, user, null);
                }else{
                    return done(null, false, req.flash('errors', match));
                }
            }
        }catch(err){
            return done(null, false, err);
        }
    }
))   
}
passport.serializeUser((user, done) => {
    done(null, user.id);
});
passport.deserializeUser(async (id, done) => {
    await loginService.findUserById(id).then((user) => {
        return done(null, user);
    }).catch(err => {
        return done(err, null);
    });
});

export default initPassportLocal;






