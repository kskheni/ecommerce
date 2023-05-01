const mongoose = require("mongoose");

const queueSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId, 
        ref: "user"
    },
    sheetName: {
        type: "String",
        required: true
    },
    status: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model("taskQueue", queueSchema);