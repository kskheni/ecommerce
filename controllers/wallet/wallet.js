const walletModel = require("../../models/wallet");
const walletTranscationModel = require("../../models/walletTransaction");
const moment = require("moment");
const _ = require("lodash");
const mongoose = require("mongoose");
const Razorpay = require("razorpay");
const { WALLET_TRANSCATION_TYPE, TRANSACTION_STATUS } = require("../../config/constant");

const uniqueName = (imageName) => {
    return Date.now() + "" + Math.floor(Math.random() * 1000000000);
}

var instance = new Razorpay({
    key_id: process.env.RZP_KEY,
    key_secret: process.env.RZP_SECRET
});

const addToWallet = async (req, res) => {
    try {
        const amount = req.body.amount;

        if (!amount) return res.status(400).send({ status: false, msg: "amount is required" });

        if (!_.isNumber(amount) && amount > 0) return res.status(400).send({ status: false, msg: "amount should be a number and greater than zero" });

        const userId = req.user._id;

        var options = {
            amount: amount * 100,
            currency: "INR",
            receipt: uniqueName()
        };

        const response = await instance.orders.create(options);

        var newTransaction = await walletTranscationModel.create({
            type: WALLET_TRANSCATION_TYPE.ADD_TO_WALLET,
            receiver: userId,
            amount: amount,
            status: response.status,
            transactionDate: moment().toISOString(true),
            orderId: response.id
        });

        res.status(200).send({
            order_id: response.id,
            currency: response.currency,
            amount: response.amount,
            rzp_key: process.env.RZP_KEY
        });
    }
    catch (err) {
        console.log(err);
        console.log("error occured while adding money to wallet");
        res.status(500).send({ status: false, msg: "error occured" });
    }
}

const sendToWallet = async (req, res) => {
    try {
        const { receiverId, amount } = req.body;

        if (!(receiverId && amount)) return res.status(400).send({ status: false, msg: "send all required info" });
        if (!mongoose.Types.ObjectId.isValid(receiverId)) return res.status(400).send({ status: false, msg: "Invalid receiver Id" });
        if (!_.isNumber(amount) && amount > 0) return res.status(400).send({ status: false, msg: "amount should be a number and greater than zero" });

        var senderWallet = await walletModel.findOne({ userId: req.user._id });
        if (!senderWallet) return res.status(400).send({ status: false, msg: "sender doesnt have wallet" });
        var receiverWallet = await walletModel.findOne({ userId: receiverId })
        if (!receiverWallet) return res.status(400).status({ status: false, msg: "receiver doesn't have a wallet" });
        if (amount > senderWallet.balance) return res.status(400).send({ status: false, msg: "Insufficient balance" });

        try {
            await walletModel.updateOne(
                { userId: req.user._id },
                { $inc: { balance: -amount } }
            );
        } catch (err) {
            await walletModel.updateOne(
                { userId: req.user._id },
                { $set: { balance: senderWallet.balance } }
            );
            throw new Error(err);
        }

        try {
            await walletModel.updateOne(
                { userId: receiverId },
                { $inc: { balance: amount } }
            );
        } catch (err) {
            await walletModel.updateOne(
                { userId: req.user._id },
                { $set: { balance: senderWallet.balance } }
            );
            
            await walletModel.updateOne(
                { userId: receiverId },
                { $set: { balance: receiverWallet.balance } }
            );
            throw new Error(err);
        }

        await walletTranscationModel.create({
            sender: req.user._id,
            receiver: receiverId,
            type: WALLET_TRANSCATION_TYPE.SEND_TO_WALLET,
            amount,
            status: TRANSACTION_STATUS.SUCCESS,
            transactionDate: moment().toISOString(true)
        });

        res.status(201).send({status:true, msg: "amount sent to intended receipient"});
    }
    catch (err) {
        console.log(err);
        console.log("error occured while sending money to someone");
        res.status(500).send({ status: false, msg: "error occured" });
    }
}

/* const createWallet = async (req,res) => {
    try{
        let userIds = await userModel.find({},{_id:1});

        for(let userId of userIds){
            if(!userId) return res.status(400).send({status:false, msg:"send userId"});

            if(!mongoose.Types.ObjectId.isValid(userId))    return res.status(400).send({status:false, msg:"send valid userId"});
    
            let exists = await walletModel.findOne({userId});
    
            if(exists)  return res.status(400).send({status:false, msg:"user already has a wallet, cannot create multiple wallets for single user"});
    
            await walletModel.create({
                userId,
                balance: 0
            });
        
        }
        res.send("done");
    }
    catch(err){
        console.log(err);
        console.log("error occured while creating wallet");
        res.status(500).send({status:false, msg:"error occured"});
    }
} */

module.exports = {
    // createWallet,
    addToWallet,
    sendToWallet
}