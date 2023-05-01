const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    vendorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "user"
    },
    price: {
        type: Number,
        required: true
    },
    stock: {
        type: Number,
        // required: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "category",
        default: null,
        // required: true
    }
});

module.exports = mongoose.model("item", itemSchema);