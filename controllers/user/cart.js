const itemModel = require("../../models/item");
const cartModel = require("../../models/cart");
const userModel = require("../../models/user");
const mongoose = require("mongoose");
const moment = require("moment");
const _ = require("lodash");

const addToCart = async (req,res) => {
    try{
        const {itemId, quantity} = req.body;

        if(!(itemId && quantity)) return res.status(400).send("send required info");
        if(!mongoose.Types.ObjectId.isValid(itemId))    return res.status(400).send("send valid item Id");

        if(!_.isInteger(quantity) || quantity < 0) return res.status(400).send({status:false, msg: "quantity cannot be set non-Integer or negative"});

        var exists = await itemModel.findOne({_id:itemId});
        // console.log(exists.stock, quantity);

        var itemInCart = await cartModel.findOne({itemId, userId:req.user._id});
        if(itemInCart){
            if(exists.stock < quantity + itemInCart.quantity)   return res.status(406).send({quantity, msg:"Cannot add to cart, as quantity(including quantity existing in cart) exceeds available stock"});

            var updated = await cartModel.updateOne(
                {_id: itemInCart._id},
                {$inc: {quantity: quantity}}
            );
    
            return res.status(200).send(updated);
        }

        if(exists.stock < quantity)  return res.status(406).send({quantity,msg:"Not enough stock available"});
        if(!exists) return res.status(400).send("item doesn't exist");

        if(!_.isInteger(quantity) && quantity < 1 )  return res.status(400).send("Quantity must be an integer and should be greater than 0");

        var newItem = await cartModel.create({
            itemId,
            userId: req.user._id,
            quantity,
            createdAt: moment().toISOString(true)
        });

        res.status(201).send(newItem);
    }
    catch(err){
        console.log(err);
        console.log("Error occured while adding item to cart");
        res.status(500).send("error occured");
    }
}

const removeFromCart = async (req,res) => {
    try{
        const id = req.body.id;

        if(!(id)) return res.status(400).send("send id");
        if(!mongoose.Types.ObjectId.isValid(id))    return res.status(400).send("send valid Id");

        var exists = await cartModel.findOne({_id:id, userId: req.user._id});

        if(!exists) return res.status(400).send("cannot remove item which is not already in your cart");

        var removed = await cartModel.deleteOne({_id: id});
        
        res.status(200).send(removed);
    }
    catch(err){
        console.log(err);
        console.log("Error occured while removing item from cart");
        res.status(500).send("error occured");
    }
}

const updateCart = async (req,res) => {
    try{
        const {id, itemId, quantity} = req.body;
        console.log("hello");

        if(!(id && itemId && quantity)) return res.status(400).send("send all required information");
        if(!mongoose.Types.ObjectId.isValid(id) && !mongoose.Types.ObjectId.isValid(itemId))  return res.status(400).send("send valid Ids");
        console.log("hello");
        
        if(!_.isInteger(quantity) || quantity < 0) return res.status(400).send({status:false, msg: "quantity cannot be set non-Integer or negative"});

        var exists = await cartModel.findOne({_id:id, itemId:itemId, userId:req.user._id});
        if(!exists) return res.status(400).send("cannot update item which is not already in your cart");

        var item = await itemModel.findOne({_id:itemId});
        if(item.quantity < quantity){
            quantity = item.quantity;
            res.status(406).send({avlQty: item.quantity, msg:"Updated Quantity is "+item.quantity});
        }

        var updated = await cartModel.updateOne(
            {_id: id},
            {$set: {quantity}}
        );

        res.status(200).send(updated);
    }
    catch(err){
        console.log(err);
        console.log("Error occured while updating cart");
        res.status(500).send("error occured");
    }
}

const getCart = async (req,res) => {
    try{
        var cart = await cartModel.find({userId: req.user._id},{__v:0}).populate("itemId", "-__v -createdAt");
        res.status(200).send(cart);
    }
    catch(err){
        console.log(err);
        console.log("Error occured while fetching cart");
        res.status(500).send("error occured");
    }
}

module.exports = {
    addToCart,
    removeFromCart,
    updateCart,
    getCart
};