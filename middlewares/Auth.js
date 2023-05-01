const passport = require("passport");
const JWTstrategy = require("passport-jwt").Strategy;
const extractJWT = require("passport-jwt").ExtractJwt;
const tokenModel = require("../models/token");
const userModel = require("../models/user");
const USER_ROLE = require("../config/constant").USER_ROLE;
const ROLE_ACCESS = require("../config/constant").ROLE_ACCESS;

const auth = (accessRequested) => async (req,res,next) => {
    // console.log(req.headers);
    const token = req.headers.authorization;
    if(!token)  return res.status(401).send("no user login found, login and try");
    var noBearerToken = token.replace("Bearer ","");
    var exists = await tokenModel.findOne({token: noBearerToken});

    if(!exists) return res.send("token does not exist");

    passport.use(
        new JWTstrategy({
            secretOrKey: process.env.TOKEN_KEY,
            jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken()
        },
        async (token, done) => {
            try{
                exists = await userModel.findOne({_id:token.user_id});

                if(!exists) return res.send("User does not exist");
                
                // the 'exists' passed in callback func. below will be saved in req.user
                if(token.role == USER_ROLE.ADMIN){
                    if(ROLE_ACCESS.ADMIN.includes(accessRequested)){
                        return done(null, exists);
                    }
                    else{
                        return done(null, false, {message: "not authorized for this action"});
                    }
                }
                else if(token.role == USER_ROLE.VENDOR){
                    if(ROLE_ACCESS.VENDOR.includes(accessRequested)){
                        return done(null, exists);
                    }
                    else{
                        return done(null, false, {message: "not authorized for this action"});
                    }
                }
                else if(token.role == USER_ROLE.USER){
                    if(ROLE_ACCESS.USER.includes(accessRequested)){
                        return done(null, exists);
                    }
                    else{
                        return done(null, false, {message: "not authorized for this action"});
                    }
                }
                else{
                    return done(null, false, {message: "Invalid Role"});
                }
            }
            catch(err){
                return done(err);
            }
        })
    )

    passport.authenticate('jwt',{session: false})(req,res,next);
    
}

module.exports = auth;





/* const passport = require("passport");
const JWTstrategy = require("passport-jwt").Strategy;
const extractJWT = require("passport-jwt").ExtractJwt;
const tokenModel = require("../models/token");
const userModel = require("../models/user");
const USER_ROLE = require("../config/constant").USER_ROLE;
const ROLE_ACCESS = require("../config/constant").ROLE_ACCESS;

const auth = (accessRequested) => async (req,res,next) => {
    
    const token = req.headers.authorization;
    var noBearerToken = token.replace("Bearer ","");
    var exists = await tokenModel.findOne({token: noBearerToken});

    if(!exists) res.send("token does not exist");

    passport.use(
        new JWTstrategy({
            secretOrKey: process.env.TOKEN_KEY,
            jwtFromRequest: extractJWT.fromAuthHeaderAsBearerToken()
        },
        async (token, done) => {
            try{
                exists = await userModel.findOne({_id:token.user_id});

                if(!exists) return res.send("User does not exist");
                
                // the 'exists' passed in callback func. below will be saved in req.user
                if(token.role == USER_ROLE.ADMIN){
                    if(ROLE_ACCESS.ADMIN.includes(accessRequested)){
                        return done(null, exists);
                    }
                    else{
                        return done(null, false, {message: "not authorized for this action"});
                    }
                }
                else if(token.role == USER_ROLE.VENDOR){
                    if(ROLE_ACCESS.VENDOR.includes(accessRequested)){
                        return done(null, exists);
                    }
                    else{
                        return done(null, false, {message: "not authorized for this action"});
                    }
                }
                else if(token.role == USER_ROLE.USER){
                    if(ROLE_ACCESS.USER.includes(accessRequested)){
                        return done(null, exists);
                    }
                    else{
                        return done(null, false, {message: "not authorized for this action"});
                    }
                }
                else{
                    return done(null, false, {message: "Invalid Role"});
                }
            }
            catch(err){
                return done(err);
            }
        })
    )
    next();
}

module.exports = auth; */



