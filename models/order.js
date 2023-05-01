const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
    // Ids of product bought
    itemId: [{
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        // required: true,
        ref: "item"
    }],
    couponId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        // required: true,
        ref: "coupon"
    },
    comboId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        // required: true,
        ref: "comboCoupon"
    },

    type: {
        type: String,
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    orderDate: {
        type: Date,
        required: true
    },
    quantity: [{
        type: Number
    }],
    amount: {
        type: Number,
        required: true
    },
    GSTAmount: {
        type: Number,
        default: 0
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderId: { // razorpay orderId
        type: String,
        required: true,
        default: null
    },
    status: {
        type: String,
        required: true,
        default: null
    },
    couponApplied: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
        ref: "coupon"
    },
    discount: {
        type: Number,
        default: 0
    },
    isCouponUsed: {
        type: Number,
        default: 0
    }
});

module.exports = mongoose.model("order", orderSchema);