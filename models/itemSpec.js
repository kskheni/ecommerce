const mongoose = require("mongoose");

const itemSpecSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "item"
    },
    specKey: {
        type: String,
        required: true
    },
    specValue: {
        type: String,
        default: null
    },
    isDeleted: {
        type: Boolean,
        default: false
    }
});

module.exports = mongoose.model("itemSpec", itemSpecSchema);