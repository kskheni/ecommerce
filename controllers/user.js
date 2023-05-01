const bcrypt = require("bcrypt");
const userModel = require("../models/user");
const tokenModel = require("../models/token");
const moment = require("moment");
const jwt = require("jsonwebtoken");
const USER_ROLE = require("../config/constant").USER_ROLE;
const walletModel = require("../models/wallet");

function generateToken(userId, role){
    return jwt.sign({user_id: userId, role: role}, process.env.TOKEN_KEY, { expiresIn: '5 days' });
}

const register = async (req, res) => {
    try{
        // console.log("hello");
        const { username, name, password, role, address, contactNumber, GSTNum } = req.body;

        if(!(username && name && password && role))   return res.status(400).send({status:false,msg:"Enter all mandatory data"});
        
        if(USER_ROLE[role] == undefined || USER_ROLE[role] == USER_ROLE.ADMIN)    
            return res.status(400).send({status:false,msg:"Bad request, not authorised or role does not exist"});

        var exists = await userModel.findOne({username: username});
        if(exists)  return res.status(409).send({status:false,msg:"user already exists"});
        
        if(GSTNum){
            var GSTNumExists = await userModel.findOne({GSTNum: GSTNum});
            if(GSTNumExists) return res.status(409).send({status:false,msg:"GST number already exists"});
        }

        if(contactNumber){
            var numExists = await userModel.findOne({contactNumber});
            if(numExists)   return res.status(409).send({status:false,msg:"Mobile number already exists"});
        }

        encryptedPassword = await bcrypt.hash(password, 10);

        const user = await userModel.create({
            username, 
            name, 
            password: encryptedPassword, 
            role: USER_ROLE[role], 
            address, 
            contactNumber, 
            GSTNum
        });

        let userWallet = await walletModel.create({
            userId: user._id,
            balance: 0
        })

        const token = generateToken(user._id, USER_ROLE[role]);

        const newTokenDoc = await tokenModel.create({
            token,
            userId: user._id,
            createdAt: moment().toISOString(true),
            role: USER_ROLE[role]
        });
        
        res.status(201).json({status:true,user,token});
    }
    catch(err){
        res.json({status:false, msg:err});
    }
}

const login = async (req, res) => {
    try{
        // console.log(req.headers.token);
        const {username, password } = req.body;
        // console.log(req.body);
        if(!(username && password )) return res.status(400).send("Enter all fields");

        var user = await userModel.findOne({username: username});

        if(user && (await bcrypt.compare(password, user.password))){
            const token = generateToken(user._id, user.role);

            const newTokenDoc = await tokenModel.create({
                token,
                userId: user._id,
                createdAt: moment().toISOString(true),
                role: user.role
            });
            
            return res.json({status:true,token:token, user});
            // res.redirect("/");
        }
        else{
            return res.json({status:false,msg:"wrong creditentials"});
        }

    }
    catch(err){
        console.log(err);
        res.json({status:false, msg:err});
    }
}

module.exports = {
    register,
    login
};