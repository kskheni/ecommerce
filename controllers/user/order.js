const mongoose = require("mongoose");
const moment = require("moment");
const itemModel = require("../../models/item");
const orderModel = require("../../models/order");
const couponModel = require("../../models/coupon");
const userModel = require("../../models/user");
const transactionModel = require("../../models/transaction");
const comboCouponModel = require("../../models/comboCoupon");
const { TRANSACTION_TYPE, TRANSACTION_STATUS, SIGNATURE_FOR, DISCOUNT_TYPE, PAYMENT_METHOD } = require("../../config/constant");
const itemDetails = require("../vendor/item").itemDetails;
const fast2sms = require('fast-two-sms');
const Razorpay = require("razorpay");
const sgMail = require('@sendgrid/mail');
const _ = require("lodash");
const walletTranscationModel = require("../../models/walletTransaction");
const walletModel = require("../../models/wallet");
const { applyCoupon } = require("../../services/common");


sgMail.setApiKey(process.env.API_KEY);

function sendMail(to, subject, body) {
    const message = {
        to: to,
        from: process.env.EMAIL_ID,
        subject: subject,
        body: body,
        html: "<h4>" + body + "</h4>"
    }
    sgMail.send(message)
        .then(response => console.log("email sent..."))
        .catch((err) => console.log("err::", err));
}

const uniqueName = (imageName) => {
    return Date.now() + "" + Math.floor(Math.random() * 1000000000);
}

var instance = new Razorpay({
    key_id: process.env.RZP_KEY,
    key_secret: process.env.RZP_SECRET
});

const placeOrder = async (req, res) => {
    try {
        req.body.items = [{ "itemId":"6214a28f8402288db5f46b12", "quantity": 3 },
                          { "itemId":"6214a2be8402288db5f46b22", "quantity": 1 }];
        req.body.couponCode = "EDCRFV";
        let user = {};
        user._id = "621311520a3e0f6852ed0447"

    
        const { items, couponCode } = req.body;

        if (!(items )) return res.status(400).send("Provide necessary data");
        if (!Array.isArray(items)) return res.status(400).send("items should be an array of items");

        var price = await applyCoupon(items, couponCode, user, 1);
        
        // console.log(price);
        
        if(!price.status)   return res.status(400).send(price.msg);

        var amount = price.amount, GSTAmount = price.GSTAmount, totalAmount = price.totalAmount, itemIds = price.itemIds, discount = price.discount, itemNames = price.itemNames;

        var options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: uniqueName()
        };
    
        const response = await instance.orders.create(options);
        var quantity = items.map((ele) => ele.quantity);
    
        var newOrder = await orderModel.create({
            itemId: itemIds,
            type: TRANSACTION_TYPE.item,
            userId: user._id,
            orderDate: moment().toISOString(true),
            quantity,
            amount,
            GSTAmount,
            totalAmount,
            orderId: response.id,
            status: response.status,
            discount
        });
        // email and sms alerts

        
        var to = "kkheni11@gmail.com";
        var subject = "Order for placed";
        var body = "Hi "+user.name+", your order for  has been placed. Total amount is "+(amount+GSTAmount);
        
        var options = {authorization : process.env.SMS_API_KEY , message : body ,  numbers : ['9586166433']} 
        var resp = await fast2sms.sendMessage(options);
        // console.log(resp);

        sendMail(to, subject, body);
       
    
        res.send({
            transactionId: newOrder._id,
            order_id: response.id,
            currency: response.currency,
            amount: response.amount,
            itemName: itemNames,
            rzp_key: process.env.RZP_KEY,
            itemIds
        });

        
        // res.json(newOrder);




                
        // var amount = 0;
        // var isCouponApplied = null;
        // var discount = 0;
        // var itemIds = items.map(ele => ele.itemId);
        // var coupon = null;

        // if (couponCode) {
        //     coupon = await couponModel.findOne({ couponCode, expiresAt: { $gte: moment().toISOString(true) } });
        //     if (!coupon) return res.status(400).send("coupon code doesnt exist or has already expired");
        //     var couponOrder = await orderModel.findOne({ couponId: coupon._id, userId: req.user._id/* status:"success",*/ });

        //     if (couponOrder.isCouponUsed != 0) return res.status(400).send({ status: false, msg: "coupon has been already used" });
        //     // var couponOrder = true;
        //     if (!couponOrder) return res.status(400).send("Invalid Coupon Applied - place order");

        //     coupon.itemIds = coupon.itemId.map((id) => id.toString());

        //     if (coupon.itemId == null || _.difference(itemIds, coupon.itemIds).length == 0) {
        //         isCouponApplied = true;
        //     }
        //     else {
        //         return res.status(400).send("coupon is not applicable");
        //     }
        // }

        // for (let ele of items) {
        //     if (!ele.itemId) return res.status(400).send("Provide Ids for all items");
        //     else {
        //         if (!mongoose.Types.ObjectId.isValid(ele.itemId)) return res.status(400).send("Invalid itemId");
        //         let item = await itemModel.findOne({ _id: ele.itemId });
        //         if (!item) return res.status(400).send("an item doesn't exist");

        //         if (ele.quantity < 1 || !_.isInteger(ele.quantity)) return res.status(400).send("cannot set quantity to less than 1 or non Integers");
        //         if (item.stock < ele.quantity) {
        //             return res.status(406).send({ avlQty: item.quantity, msg: "Updated Quantity is " + item.quantity });
        //         }

        //         amount = amount + item.price * ele.quantity;
        //     }
        // }
        // var itemNames = (await itemModel.find({ _id: { $in: itemIds } })).map((obj) => obj.name);
        // if (coupon) {
        //     if (coupon.minSpend > amount) {
        //         isCouponApplied = false;
        //         return res.status(400).send("Amount(excluding GST) should be minimum " + coupon.minSpend + ", your total amount is " + amount);
        //     }
        //     await orderModel.updateOne(
        //         { _id: couponOrder._id },
        //         { $set: { isCouponUsed: 1 } }
        //     );

        //     if (coupon.type == DISCOUNT_TYPE.FLATOFF) {
        //         discount = coupon.discount;
        //     }
        //     else if (coupon.type == DISCOUNT_TYPE.PERCENTAGE) {
        //         discount = Math.min(coupon.maxDiscount, amount * coupon.discount / 100);
        //     }
        // }

        

        // var GSTAmount = 0.18 * amount;
        // var totalAmount = amount + GSTAmount - discount;

    }
    catch (err) {
        console.log(err);
        console.log("error occured at placeOrder");
        res.send("error occured");
    }
}

const verifySignature = async (req, res) => {
    try {
        var data = JSON.parse(req.body.data);
        // console.log(data);
        if (data.status == "Success") {
            let body = data.razorpay_order_id + "|" + data.razorpay_payment_id;

            var crypto = require("crypto");
            var expectedSignature = crypto.createHmac('sha256', process.env.RZP_SECRET)
                .update(body.toString())
                .digest('hex');

            var response = { "signatureIsValid": "false" }

            if (expectedSignature === data.razorpay_signature) {
                response = { "signatureIsValid": "true" }

                await transactionModel.create({
                    orderId: data.razorpay_order_id,
                    paymentId: data.razorpay_payment_id,
                    signature: data.razorpay_signature,
                    amount: data.amount / 100,
                    status: data.status
                });

                if (data.flag == SIGNATURE_FOR.ITEM) {
                    await orderModel.updateOne(
                        { orderId: data.razorpay_order_id },
                        { $set: { status: data.status } }
                    );

                    await itemModel.updateOne(
                        { _id: data.itemId },
                        { $inc: { stock: -data.quantity } }
                    );
                }
                else if (data.flag == SIGNATURE_FOR.WALLET) {
                    //////////////////////////////////////////////////////////////
                    await walletTranscationModel.updateOne(
                        { orderId: data.razorpay_order_id },
                        { $set: { status: data.status } }
                    );

                    await walletModel.updateOne(
                        { userId: req.user._id },
                        { $inc: { balance: amount / 100 } }
                    );
                }

            }
            else {
                await orderModel.updateOne(
                    { orderId: data.razorpay_order_id, },
                    { $set: { status: "Failure" } }
                )

                await transactionModel.create({
                    orderId: data.razorpay_order_id,
                    paymentId: data.razorpay_payment_id,
                    amount: data.amount / 100,
                    status: "Failure",
                    errorReason: "Signature Validation Failed"
                });
            }

            res.send(response);
        }
        else if (data.status == "Failure") {
            // console.log(data);
            await orderModel.updateOne(
                { orderId: data.error.metadata.order_id },
                { $set: { status: data.status } }
            )

            await transactionModel.create({
                orderId: data.error.metadata.order_id,
                paymentId: data.error.metadata.payment_id,
                amount: data.amount / 100,
                status: data.status,
                errorReason: data.error.reason,
                errorDesc: data.error.description,
                errorCode: data.error.code
            })

            res.send("Payment Failure");
        }
    }
    catch (err) {
        console.log(err);
        res.send("error occured");
    }
};

const buyCoupon = async (req, res) => {
    try {
        const couponId = req.body.id;

        if (!couponId) return res.status(400).send("provide coupon Id");
        if (!mongoose.Types.ObjectId.isValid(couponId)) return res.status(400).send("invalid Coupon Id");

        let coupon = await couponModel.findOne({ _id: couponId });
        if (!coupon) return res.status(400).send("Coupon Id doesn't exists");

        let exists = await orderModel.findOne({ userId: req.user._id, couponId });
        if (exists) return res.status(401).send("cannot purchase same coupon twice");

        var amount = coupon.price;
        var totalAmount = amount;

        var options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: uniqueName()
        };

        const response = await instance.orders.create(options);

        var newOrder = await orderModel.create({
            couponId,
            type: TRANSACTION_TYPE.coupon,
            userId: req.user._id,
            orderDate: moment().toISOString(true),
            amount,
            totalAmount,
            orderId: response.id,
            status: response.status,
            isCouponUsed: false
        });

        res.send({
            transactionId: newOrder._id,
            order_id: response.id,
            currency: response.currency,
            amount: response.amount,
            itemName: coupon.couponCode,
            rzp_key: process.env.RZP_KEY,
            couponId
        });

        /*
        email and sms notifications

        var to = user.email;
        var subject = "Coupon " + coupon.couponCode + " has been purchased";
        var body = "Hi " + user.name + ", your order for coupon code" + coupon.couponCode + " has been placed. Quantity ordered is 1 and total payable amount is " + amount;

        sendMail(to, subject, body); 
        */

    }
    catch (err) {
        console.log(err);
        console.log("error occured at buyCoupon");
        res.send("error occured");
    }
}

const buyComboCoupon = async (req, res) => {
    try {
        const comboId = req.body.id;

        if (!(comboId)) return res.status(400).send("enter all fields");
        if (!mongoose.Types.ObjectId.isValid(comboId)) return res.status(400).send("Invalid combo id");

        var combo = await comboCouponModel.findOne({ _id: comboId });
        if (!combo) return res.send("combo does not exist");

        var exists = await orderModel.findOne({ couponId: { $in: combo.couponId }, userId: req.user._id });
        if (exists) return res.status(401).send("cannot purchase combo as you have already purchase a coupon from the combo");

        var amount = combo.price;
        var totalAmount = amount;

        var options = {
            amount: totalAmount * 100,
            currency: "INR",
            receipt: uniqueName()
        };

        const response = await instance.orders.create(options);

        var comboLen = combo.couponId.length;
        var orderArr = combo.couponId.map((id) => {
            var obj = {
                couponId: id,
                comboId,
                type: TRANSACTION_TYPE.comboCoupon,
                userId: req.user._id,
                orderDate: moment().toISOString(true),
                amount: amount / comboLen,
                totalAmount: amount / comboLen,
                orderId: response.id,
                status: response.status,
                isCouponUsed: false
            }
            return obj;
        });

        // console.log(orderArr);
        var newCombo = await orderModel.insertMany(orderArr);
        // console.log(newCombo);
        /* var comboDetails = await comboCouponModel.find({ _id: comboId }).populate("couponId");
        var couponcodes = "";
        let flag = 1;

        comboDetails[0].couponId.forEach(element => {
            couponcodes = couponcodes + (flag ? "" : ", ") + element.couponCode;
            flag = 0;
        });

        var to = user.email;
        var subject = "Coupon Combo has been purchased";
        var body = "Hi " + user.name + ", your order for coupon combo of " + couponcodes + " has been placed. Total payable amount is " + amount;

        sendMail(to, subject, body);
        */

        res.json(newCombo);
    }
    catch (err) {
        console.log(err);
        console.log("error occured at buyComboCoupon");
        res.send("error occured");
    }
}

const query = async (req, res) => {
    // console.log(req.body);
    const startDate = moment(req.body.startDate).toISOString(true);
    const endDate = moment(req.body.endDate).toISOString(true);


    var monthArray = [];
    var sMonth = moment(startDate).format('M');
    var sYear = moment(startDate).format('Y');
    var eMonth = moment(endDate).format('M');
    var eYear = moment(endDate).format('Y');

    for (let year = sYear; year <= eYear; year++) {

        let tempMonth = 12;
        if (year == eYear) tempMonth = eMonth;

        for (let month = sMonth; month <= tempMonth; month++) {
            monthArray.push(moment(year + "-" + month, "YYYY-M").format("YYYY-MM"));
        }
        sMonth = 1;
    }
    console.log(monthArray);

    var IDs = await orderModel.aggregate([
        {
            $match: {
                orderDate: {
                    $gte: new Date(startDate),
                    $lt: new Date(endDate)
                }
            }
        },
        {
            $project: {
                userId: 1,
                totalAmount: 1,
                monthyear: { $dateToString: { format: "%Y-%m", date: "$orderDate" } }
            }
        },
        {
            $group: {
                _id: "$monthyear",
                users: { $addToSet: "$_id" },
                totalAmount: { $sum: "$totalAmount" }
            }
        },
        { $sort: { _id: 1 } },
        {
            $group: {
                _id: null,
                stats: { $push: "$$ROOT" }
            }
        },
        {
            $project: {
                stats: {
                    $map: {
                        input: monthArray,
                        as: "date",
                        in: {
                            $let: {
                                vars: { dateIndex: { "$indexOfArray": ["$stats._id", "$$date"] } },
                                in: {
                                    $cond: {
                                        if: { $ne: ["$$dateIndex", -1] },
                                        then: { $arrayElemAt: ["$stats", "$$dateIndex"] },
                                        else: { _id: "$$date", users: [], totalAmount: 0 }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    ]);

    res.json(IDs[0].stats);
    /*
    var IDs = await orderModel.aggregate([
        {
            $match: {
                orderDate: { 
                    $gte:new Date(startDate), 
                    $lt:new Date(endDate) 
                }
            }
        },
        {
            $project:{ 
                userId:1, 
                totalAmount:1,
                monthyear:{ $dateToString: { format: "%m-%Y", date: "$orderDate" } }
            }
        },
        {
            $group:{
                _id: "$monthyear",
                users: {$addToSet:"$_id"},
                totalAmount: {$sum: "$totalAmount"},
                count: { $sum: 1 }
            }
        }
    ]);
    */
}

const invoice = async (req, res) => {
    try {
        // postman testing

/*         req.body.items = [{ "itemId":"6214a28f8402288db5f46b12", "quantity": 3 },
                          { "itemId":"6214a2be8402288db5f46b22", "quantity": 1 }];
        req.body.couponCode = "EDCRFV";
        let user = {};
        user._id = "621311520a3e0f6852ed0447"
 */


        
        const { items, couponCode } = req.body;

        if (!(items)) return res.status(400).send("Provide necessary data");
        if (!Array.isArray(items)) return res.status(400).send("items should be an array of items");
        
        var price = await applyCoupon(items, couponCode, user, 0);
        
        console.log(price);
        
        if(!price.status)   return res.status(400).send(price.msg);

        var amount = price.amount, GSTAmount = price.GSTAmount, totalAmount = price.totalAmount, discount = price.discount;

        res.status(200).send({ items, amount, GSTAmount, discount, totalAmount });

        // var amount = 0;
        // var isCouponApplied = null;
        // var discount = 0;
        // var itemIds = items.map(ele => ele.itemId);
        // var coupon = null;

        // if (couponCode) {
        //     coupon = await couponModel.findOne({ couponCode, expiresAt: { $gte: moment().toISOString(true) } });
        //     if (!coupon) return res.status(400).send("coupon code doesnt exist or has already expired");
        //     var couponOrder = await orderModel.findOne({ couponId: coupon._id, userId: req.user._id, /*status:"success",*/ isCouponUsed: 0 });
        //     // var couponOrder = true;
        //     if (!couponOrder) return res.status(400).send("Invalid Coupon Applied - Invoice");

        //     coupon.itemIds = coupon.itemId.map((id) => id.toString());

        //     if (coupon.itemId == null || _.difference(itemIds, coupon.itemIds).length == 0) {
        //         isCouponApplied = true;
        //     }
        //     else {
        //         return res.status(400).send("coupon is not applicable");
        //     }
        // }

        // for (let ele of items) {
        //     if (!ele.itemId) return res.status(400).send("Provide Ids for all items");
        //     else {
        //         if (!mongoose.Types.ObjectId.isValid(ele.itemId)) return res.status(400).send("Invalid itemId");
        //         let item = await itemModel.findOne({ _id: ele.itemId });
        //         if (!item) return res.status(400).send("an item doesn't exist");
        //         // console.log(_.isInteger(ele.quantity), typeof ele.quantity);
        //         if (ele.quantity < 1 || !_.isInteger(ele.quantity)) return res.status(400).send("cannot set quantity to less than 1 or non Integers");
        //         if (item.stock < ele.quantity) {
        //             return res.status(406).send({ avlQty: item.quantity, msg: "Updated Quantity is " + item.quantity });
        //         }
        //         ele.item = await itemDetails(item._id);
        //         amount = amount + item.price * ele.quantity;
        //     }
        // }

        // if (coupon) {
        //     if (coupon.minSpend > amount) {
        //         isCouponApplied = false;
        //         return res.status(400).send("Amount(excluding GST) should be minimum " + coupon.minSpend + ", your total amount is " + amount);
        //     }
        //     // await orderModel.updateOne(
        //     //     {_id: couponOrder._id},
        //     //     { $set: {isCouponUsed: 1}}
        //     // );

        //     if (coupon.type == DISCOUNT_TYPE.FLATOFF) {
        //         discount = coupon.discount;
        //     }
        //     else if (coupon.type == DISCOUNT_TYPE.PERCENTAGE) {
        //         discount = Math.min(coupon.maxDiscount, amount * coupon.discount / 100);
        //     }
        // }

        // var GSTAmount = 0.18 * amount;
        // var totalAmount = amount + GSTAmount - discount;
    }
    catch (err) {
        console.log(err);
        console.log("error occured - invoice");
        res.status(500).send("error occured");
    }
}

module.exports = {
    placeOrder,
    query,
    buyCoupon,
    buyComboCoupon,
    verifySignature,
    invoice
};