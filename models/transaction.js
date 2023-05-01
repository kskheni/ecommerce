const mongoose = require("mongoose");

const transactionSchema = mongoose.Schema({
    orderId: {
        type: String,
        required: true
    },
    paymentId: {
        type: String,
        required: true,
        default: null
    },
    signature: {
        type: String,
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    errorReason: {
        type: String,
        default: null
    },
    errorDesc: {
        type: String,
        default: null
    },
    errorCode: {
        type: String,
        default: null
    }
});

module.exports = mongoose.model("transaction", transactionSchema)