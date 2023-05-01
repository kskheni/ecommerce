const mongoose = require("mongoose");

const SPTransSchema = mongoose.Schema({
    VchNo: {
        type: Number
    },
    Trans_Date: {
        type: Date
    },
    Party: {
        type: String
    },
    Item: {
        type: String
    },
    Qty: {
        type: Number
    },
    Rate: {
        type: Number
    },
    Amt: {
        type: Number
    },
    Sales: {
        type: String
    },
    CGST: {
        type: String
    },
    SGST: {
        type: String
    },
    IGST: {
        type: String
    },
    "Party Ledger": {
        type: String
    },
    "GST Amt": {
        type: Number
    },
    GSTPer: {
        type: Number
    },
    "Total Amount": {
        type: Number
    },
    Remarks: {
        type: String
    },
    "item Narration": {
        type: Number
    },
    GSTNum: {
        type: String
    },
    "Place Of Supply": {
        type: String
    },
    Purchase: {
        type: String
    }
})

module.exports = mongoose.model("SPTransactions", SPTransSchema);