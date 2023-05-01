const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    // email:{
    //     type:String,
    //     required:true
    // },
    role: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true,
    },
    password: {
        type: String,
        required: true,
    },
    address: {
        type: String,
        default: null
    },
    contactNumber: {
        type: Number,
        default: null
    },
    GSTNum: {
        type: String,
        default: null
    }
    
});

module.exports = mongoose.model("user", userSchema);