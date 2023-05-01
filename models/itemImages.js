const mongoose = require("mongoose");

const itemImagesSchema = new mongoose.Schema({
    itemId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "item"
    },
    name: {
        type: String,
        unique:true,
        required: true
    },
    isDeleted: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: null
    },
    deletedAt: {
        type: Date,
        default: null
    },
    updatedAt: {
        type: Date,
        default: null
    }
});

module.exports = mongoose.model("itemImages", itemImagesSchema);