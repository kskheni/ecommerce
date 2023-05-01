const mongoose = require("mongoose");

const combo = new mongoose.Schema({
    couponId: [{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "coupon"
    }],
    price: {
        type: Number,
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    }
});

module.exports = mongoose.model("comboCoupon", combo);