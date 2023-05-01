const mongoose = require("mongoose");

const wltTranscationSchema = mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        default: null
    },
    type: {
        type: String,
        required:true,
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        required: true
    },
    transactionDate: {
        type: Date,
        required: true
    },
    orderId: {
        type: String,
        default: null
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "item",
        default: null
    }
})

module.exports = mongoose.model("walletTranscation", wltTranscationSchema);