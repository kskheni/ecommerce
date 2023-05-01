const moment = require("moment");
const couponModel = require("../../models/coupon");
const comboCouponModel = require("../../models/comboCoupon");
const orderModel = require("../../models/order");
const itemModel = require("../../models/item");
const { default: mongoose } = require("mongoose");
const _ = require("lodash");
const { TRANSACTION_TYPE } = require("../../config/constant");
const DISCOUNT_TYPE = require("../../config/constant").DISCOUNT_TYPE;

const addcoupon = async (req, res) => {
    try {
        const { couponCode, type, discount, price, maxDiscount, minSpend, description, expiresAt } = req.body;
        var itemId = req.body.itemId;
        console.log(itemId);
        if (!(couponCode && type && discount && price && minSpend && expiresAt)) return res.send("enter all required fields");

        if (type == DISCOUNT_TYPE.PERCENTAGE) {
            if (!(discount <= 100 || discount > 0)) {
                return res.status(400).send("Enter appropriate percentages");
            }
        }
        else if (type == DISCOUNT_TYPE.FLATOFF) {
            if (discount > minSpend) {
                return res.status(400).send("Discount should be less than minimum spend");
            }
        }
        else {
            return res.status(400).send("Send valid discount type");
        }

        var isCouponUnique = await couponModel.findOne({ couponCode });
        if (isCouponUnique) return res.send("Coupon code already exists");

        if (itemId) {
            if (!Array.isArray(itemId)) res.status(400).send("itemId should be either global(null) or array of itemId");
            else {
                for (let item of itemId) {
                    if (!mongoose.Types.ObjectId.isValid(item)) return res.status(400).send("invalid item Id found");

                    let isItem = await itemModel.findOne({ _id: item, vendorId: req.user._id });
                    if (!isItem) return res.status(400).send("coupon can be added to only those items that are sold by you");
                }
            }
        }
        else itemId = null;

        if (!moment(expiresAt, 'DD-MM-YY', true).isValid()) return res.status(400).send("Date should be in 'DD-MM-YY' format");

        var newCoupon = await couponModel.create({
            couponCode, itemId, vendorId: req.user._id, type, discount, price, maxDiscount, minSpend, description, expiresAt: moment(expiresAt, 'DD-MM-YY').toISOString(true)
        });

        res.status(201).json(newCoupon);
    }
    catch (err) {
        console.log(err);
        res.send("error occured while adding coupon");
    }
}

const getCoupon = async (req, res) => {
    try {
        var coupons = await couponModel.find({}, { __v: 0 });
        res.status(200).json(coupons);
    }
    catch (err) {
        console.log(err);
        console.log("error occured at getCoupons");
        res.send("error occured")
    }
}

const addComboCoupon = async (req, res) => {
    try {
        const { couponId, price } = req.body;
        if (!Array.isArray(couponId)) return res.send("add multiple coupons");

        if (!couponId || couponId.length < 2) return res.send("add multiple coupon Id");

        if (!price || !_.isNumber(price)) return res.send("Invalid price");

        for (var i = 0; i < couponId.length; i++) {
            var isCoupon = await couponModel.findOne({ _id: couponId[i], vendorId: req.user._id });

            if (!isCoupon)
                return res.send("add valid coupons");
        }

        var newCombo = await comboCouponModel.create({ couponId, price, vendorId: req.user._id });

        res.json(newCombo);
    }
    catch (err) {
        console.log(err);
        console.log("error at comboCoupon");
        res.send("error occured");
    }
}

const getComboCoupon = async (req, res) => {
    try {
        var combos = await comboCouponModel.aggregate([
            {
                $lookup: {
                    from: "coupons",
                    localField: "couponId",
                    foreignField: "_id",
                    as: "coupon"
                }
            },
            {
                $project: { __v: 0, "coupon.__v": 0 }
            }
        ]);

        res.json(combos);
    }
    catch (err) {
        console.log("error occured at getComboCoupon");
        console.log(err);
        res.send("error occured");
    }
}

/* const applyCoupon = async (req,res) => {
    try{
        const {items, couponCode} = req.body;

        if (!(items)) return res.status(400).send("Provide necessary data");
        if (!Array.isArray(items))   return res.status(400).send("items should be an array of items");
        var amount = 0;

        var isCouponApplied = null;
        var discount = 0;
        var itemIds = items.map(ele => ele.itemId);
        var coupon = null;

        if(couponCode){
            coupon = await couponModel.findOne({couponCode, expiresAt:{$gte:moment().toISOString(true)}});
            if(!coupon) return res.status(400).send("coupon code doesnt exist or has already expired");
            var couponOrder = await orderModel.findOne({couponId:coupon._id, userId: req.user._id, status:"success", isCouponApplied: 0});
            // var couponOrder = true;
            if(!couponOrder)    return res.status(400).send("Invalid Coupon Applied - place order");

            coupon.itemIds = coupon.itemId.map((id)=> id.toString());

            if(coupon.itemId == null || _.difference(itemIds, coupon.itemIds).length == 0){
                isCouponApplied = true;
            }
            else{
                return res.status(400).send("coupon is not applicable");
            }
        }

        for(let ele of items){
            if(!ele.itemId) return res.status(400).send("Provide Ids for all items");
            else{
                if(!mongoose.Types.ObjectId.isValid(ele.itemId))    return res.status(400).send("Invalid itemId");
                let item = await itemModel.findOne({_id: ele.itemId});
                if(!item)   return res.status(400).send("an item doesn't exist");

                if(ele.quantity<1)  return res.status(400).send("cannot set quantity to zero");
                if(item.stock < ele.quantity){
                    return res.status(406).send({avlQty: item.quantity, msg:"Updated Quantity is "+item.quantity});
                }

                amount = amount + item.price*ele.quantity; 
            }
        }

        if(coupon){
            if(coupon.minSpend > amount){
                isCouponApplied = false;
                return res.status(400).send("Amount(excluding GST) should be minimum "+coupon.minSpend+", your total amount is "+amount);
            }
            await orderModel.updateOne(
                {_id: couponOrder._id},
                { $set: {isCouponUsed: 1}}
            );

            if(coupon.type == DISCOUNT_TYPE.FLATOFF){
                discount = coupon.discount;
            }   
            else if(coupon.type == DISCOUNT_TYPE.PERCENTAGE){
                discount = Math.min(coupon.maxDiscount, amount*coupon.discount/100);
            }         
        } 
        // change flag of isCouponUsed here::::::::::::::::::::::::

        var GSTAmount = amount*0.18;
        var totalAmount = amount + GSTAmount - discount;
        res.status(200).send({amount, GSTAmount, discount, totalAmount});
    }
    catch(err){
        console.log(err);
        console.log("error occured while appluing coupon");
        res.status(500).send("error occured");
    }
}
 */
const myCoupons = async (req,res) => {
    try{
        var coupons = await orderModel.find({userId:req.user._id, type: {$in:[TRANSACTION_TYPE.coupon,TRANSACTION_TYPE.comboCoupon]}, isCouponUsed: 0});
        res.status(200).send(coupons);
    }
    catch(err){
        console.log(err);
        console.log("error occured while getting user's coupons");
        res.status(500).send("Error occured while fetching user owned coupons");
    }
}

module.exports = {
    addcoupon,
    getCoupon,
    addComboCoupon,
    getComboCoupon,
    // applyCoupon,
    myCoupons
}