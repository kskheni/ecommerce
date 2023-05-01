const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema({
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    itemId: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "item"
    }],
    vendorId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    type: {
        type: String,
        required: true
    },
    discount: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true,
        default: 0
    },
    maxDiscount: { // only for percentage discounts 
        type: Number,
        default: null
    },
    minSpend: {
        type: Number,
        default: 0
    },
    description: {
        type: String,
        default: ""
    },
    expiresAt: {
        type: Date,
        required: true,
        default: null
    }
});

module.exports = mongoose.model("coupon", couponSchema);