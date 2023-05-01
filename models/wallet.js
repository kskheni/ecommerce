const mongoose = require("mongoose");

const walletSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    balance: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model("wallet", walletSchema);