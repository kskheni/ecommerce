const mongoose = require("mongoose");

const cartSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "user",
        required: true
    },
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "item",
        required: true
    },
    quantity: {
        type: Number,
        default: 1
    },
    createdAt: {
        type: Date,
        required: true
    }
});

module.exports = mongoose.model("cart", cartSchema);