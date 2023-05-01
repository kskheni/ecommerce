const mongoose = require("mongoose");
const categoryModel = require("../../models/category");
const itemModel = require("../../models/item");
const _ = require("lodash");
const moment = require("moment");

const addCategory = async (req,res) => {
    try{
        const name = req.body.name;
        var parent = req.body.parent;
        
        if(!(name))   res.status(400).send("insufficient data");
        var exists = await categoryModel.findOne({name});
        if(exists)  return res.status(400).send("Category already exists");

        if(parent){
            if(!mongoose.Types.ObjectId.isValid(parent))    return res.status(400).send("Invalid parent");

            exists = await categoryModel.findOne({_id: parent});
            if(!exists) return res.status(400).send("Parent category doesn't exist");    
            
            await categoryModel.create({
                name, parent
            });
        }
        else{
            await categoryModel.create({
                name
            });
        }

        res.status(201).send(name + " category added");
    }
    catch(err){
        console.log(err);
        console.log("error at addCategory");
        res.status(500).send("error occured");
    }
}

const removeCategory = async (req,res) => {
    try {
        const id = req.body.id;

        if(!id) return res.status(400).send("Provide category id");

        if(!mongoose.Types.ObjectId.isValid(id))    return res.status(400).send("Invalid Id");
        
        var exists = await categoryModel.findOne({_id: id});
        if(!exists) return res.status(400).send("Category doesn't exist");

        var arrId = [id];
        var arr1 = [];

        while(arrId.length != 0){
            
            var isItem = await itemModel.findOne({category: { $in: arrId } },{name:1, category:1});
            if(isItem){
                return res.status(400).send({msg:"Items exists in the given category, so cannot delete it"});
            }  
            arr1 = _.concat(arr1, arrId);
            var subcategory = await categoryModel.find({parent: {$in: arrId}},{_id:1});
            arrId = subcategory.map((obj) => obj._id);
            isItem = null;
        }

        var isDeleted = await categoryModel.updateMany({_id: {$in: arr1}}, {$set: {deletedAt: moment().toISOString(true)}});
        
        res.send(isDeleted);
    }
    catch(err) {
        console.log(err);
        console.log("error at removeCategory");
        res.status(500).send("error occured");
    }
}

const getCategory = async (req,res) => {
    try{
        const parent = req.body.parent;
        var categories = await categoryModel.find({parent, deletedAt:null},{deletedAt:0, __v:0, disabledAt:0});
        res.status(200).json(categories);
    }
    catch(err){
        console.log(err);
        console.log("error at getCategory");
        res.status(500).send("error occured");
    }
}

const updateCategory = async (req,res) => {
    try{
        const { id, name, parent } = req.body;
        
        if(!(id && name && mongoose.Types.ObjectId.isValid(id)))    return res.status(400).send({status:false, msg:"Inappropriate data"});

        var exists = await categoryModel.findOne({id});
        if(!exists)  return res.status(400).send({status:false, msg:"Category doesnt exist"});

        if(parent){
            if(!mongoose.Types.ObjectId.isValid(parent))    return res.status(400).send({status:false, msg:"Invalid parent"});

            if(id==parent)  return res.status(400).send({status:false, msg:"cannot set parent category as the category itself"});
            
            exists = await categoryModel.findOne({_id: parent});
            if(!exists) return res.status(400).send({status:false, msg:"cannot set parent category that doesnt exist"});    
            
            await categoryModel.updateOne({_id:id}, {$set: {name, parent}});
        }
        else{
            await categoryModel.updateOne({_id:id}, {$set: {name, parent:null}});
        }

        res.status(200).send({status:true, msg:"updated"});
    }
    catch(err){
        console.log(err);
        console.log("error at updateCategory");
        res.status(500).send("error occured");
    }
}
 
module.exports = {
    addCategory,
    removeCategory,
    getCategory,
    updateCategory
}