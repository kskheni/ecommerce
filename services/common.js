const mongoose = require("mongoose");
const moment = require("moment");
const itemModel = require("../models/item");
const orderModel = require("../models/order");
const couponModel = require("../models/coupon");
const { DISCOUNT_TYPE } = require("../config/constant");
const _ = require("lodash");

const applyCoupon = async (items, couponCode, user, isCouponUsed) => {
    var amount = 0;
    var isCouponApplied = null;
    var discount = 0;
    var itemIds = items.map(ele => ele.itemId);
    var coupon = null;

    if (couponCode) {
        coupon = await couponModel.findOne({ couponCode, expiresAt: { $gte: moment().toISOString(true) } });
        if (!coupon) return {status:false, msg:"coupon code doesnt exist or has already expired"};
        var couponOrder = await orderModel.findOne({ couponId: coupon._id, userId: user._id/* status:"success",*/ });

        // if (couponOrder.isCouponUsed != 0) return {status:false, msg:"coupon has been already used" };
        // var couponOrder = true;
        if (!couponOrder) return {status:false, msg:"Invalid Coupon Applied - place order"};

        coupon.itemIds = coupon.itemId.map((id) => id.toString());

        if (coupon.itemId == null || _.difference(itemIds, coupon.itemIds).length == 0) {
            isCouponApplied = true;
        }
        else {
            return {status:false, msg:"coupon is not applicable"};
        }
    }

    for (let ele of items) {
        if (!ele.itemId) return {status:false, msg:"Provide Ids for all items"};
        else {
            if (!mongoose.Types.ObjectId.isValid(ele.itemId)) return {status:false, msg:"Invalid itemId"};
            let item = await itemModel.findOne({ _id: ele.itemId });
            if (!item) return {status:false, msg:"an item doesn't exist"};

            if (ele.quantity < 1 || !_.isInteger(ele.quantity)) return {status:false, msg:"cannot set quantity to less than 1 or non Integers"};
            if (item.stock < ele.quantity) {
                return {status:false, avlQty: item.quantity, msg: "Updated Quantity is " + item.quantity};
            }

            amount = amount + item.price * ele.quantity;
        }
    }
    var itemNames = (await itemModel.find({ _id: { $in: itemIds } })).map((obj) => obj.name);
    if (coupon) {
        if (coupon.minSpend > amount) {
            isCouponApplied = false;
            return {status:false, msg:"Amount(excluding GST) should be minimum " + coupon.minSpend + ", your total amount is " + amount};
        }
        await orderModel.updateOne(
            { _id: couponOrder._id },
            { $set: { isCouponUsed } }
        );

        if (coupon.type == DISCOUNT_TYPE.FLATOFF) {
            discount = coupon.discount;
        }
        else if (coupon.type == DISCOUNT_TYPE.PERCENTAGE) {
            discount = Math.min(coupon.maxDiscount, amount * coupon.discount / 100);
        }
    }

    var GSTAmount = 0.18 * amount;
    var totalAmount = amount + GSTAmount - discount;

    return {status:true, amount, GSTAmount, totalAmount, itemIds, discount, itemNames};
}

module.exports = {
    applyCoupon
}


// try {
//     req.body.items = [{ itemId: "6214aa192e281b6a0b41e4e0", quantity: 5 }];
//     const { items, couponCode } = req.body;

//     if (!(items)) return res.status(400).send("Provide necessary data");
//     if (!Array.isArray(items)) return res.status(400).send("items should be an array of items");
//     var amount = 0;

//     var isCouponApplied = null;
//     var discount = 0;
//     var itemIds = items.map(ele => ele.itemId);
//     var coupon = null;

//     if (couponCode) {
//         coupon = await couponModel.findOne({ couponCode, expiresAt: { $gte: moment().toISOString(true) } });
//         if (!coupon) return res.status(400).send("coupon code doesnt exist or has already expired");
//         var couponOrder = await orderModel.findOne({ couponId: coupon._id, userId: req.user._id/* status:"success",*/ });

//         if (couponOrder.isCouponUsed != 0) return res.status(400).send({ status: false, msg: "coupon has been already used" });
//         // var couponOrder = true;
//         if (!couponOrder) return res.status(400).send("Invalid Coupon Applied - place order");

//         coupon.itemIds = coupon.itemId.map((id) => id.toString());

//         if (coupon.itemId == null || _.difference(itemIds, coupon.itemIds).length == 0) {
//             isCouponApplied = true;
//         }
//         else {
//             return res.status(400).send("coupon is not applicable");
//         }
//     }

//     for (let ele of items) {
//         if (!ele.itemId) return res.status(400).send("Provide Ids for all items");
//         else {
//             if (!mongoose.Types.ObjectId.isValid(ele.itemId)) return res.status(400).send("Invalid itemId");
//             let item = await itemModel.findOne({ _id: ele.itemId });
//             if (!item) return res.status(400).send("an item doesn't exist");

//             if (ele.quantity < 1 || !_.isInteger(ele.quantity)) return res.status(400).send("cannot set quantity to less than 1 or non Integers");
//             if (item.stock < ele.quantity) {
//                 return res.status(406).send({ avlQty: item.quantity, msg: "Updated Quantity is " + item.quantity });
//             }

//             amount = amount + item.price * ele.quantity;
//         }
//     }
//     var itemNames = (await itemModel.find({ _id: { $in: itemIds } })).map((obj) => obj.name);
//     if (coupon) {
//         if (coupon.minSpend > amount) {
//             isCouponApplied = false;
//             return res.status(400).send("Amount(excluding GST) should be minimum " + coupon.minSpend + ", your total amount is " + amount);
//         }
//         await orderModel.updateOne(
//             { _id: couponOrder._id },
//             { $set: { isCouponUsed: 1 } }
//         );

//         if (coupon.type == DISCOUNT_TYPE.FLATOFF) {
//             discount = coupon.discount;
//         }
//         else if (coupon.type == DISCOUNT_TYPE.PERCENTAGE) {
//             discount = Math.min(coupon.maxDiscount, amount * coupon.discount / 100);
//         }
//     }

//     let user = {};
//     user._id = "621311d29ea0881d6f0c0e23"

//     var GSTAmount = 0.18 * amount;
//     var totalAmount = amount + GSTAmount - discount;

//     var options = {
//         amount: totalAmount * 100,
//         currency: "INR",
//         receipt: uniqueName()
//     };

//     const response = await instance.orders.create(options);
//     var quantity = items.map((ele) => ele.quantity);

//     var newOrder = await orderModel.create({
//         itemId: itemIds,
//         type: TRANSACTION_TYPE.item,
//         userId: user._id,
//         orderDate: moment().toISOString(true),
//         quantity,
//         amount,
//         GSTAmount,
//         totalAmount,
//         orderId: response.id,
//         status: response.status,
//         discount
//     });

//     res.send({
//         transactionId: newOrder._id,
//         order_id: response.id,
//         currency: response.currency,
//         amount: response.amount,
//         itemName: itemNames,
//         rzp_key: process.env.RZP_KEY,
//         itemIds
//     });

//     // email and sms alerts

//     /*
//     var to = user.email;
//     var subject = "Order for "+item.name+" placed";
//     var body = "Hi "+user.name+", your order for "+item.name+" has been placed. Total amount is "+(amount+GSTAmount);
    
//     var options = {authorization : process.env.SMS_API_KEY , message : body ,  numbers : ['9586166433']} 
//     var response = await fast2sms.sendMessage(options);
//     console.log(response);

//     sendMail(to, subject, body);
//     */
//     // res.json(newOrder);
// }
// catch (err) {
//     console.log(err);
//     console.log("error occured at placeOrder");
//     res.send("error occured");
// }