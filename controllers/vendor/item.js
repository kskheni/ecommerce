const mongoose = require("mongoose");
const itemModel = require("../../models/item");
const itemSpecModel = require("../../models/itemSpec");
const itemImageModel = require("../../models/itemImages");
const categoryModel = require("../../models/category");
const userModel = require("../../models/user");
const path = require("path");
const moment = require("moment");
const _ = require("lodash");
const xlsx = require("xlsx");
const fs = require("fs");
// const Queue = require("bull");
// const consumer = require("../../services/consumer");
// const taskQueueModel = require("../../models/taskQueue");
// const cron = require("node-cron");
const sheetQueue = require("../../services/Queue").Queue;

const queue = new sheetQueue();

const uniqueName = (imageName) => {
    var parts = imageName.split(".");
    var imageExt = parts[parts.length - 1];
    imageName = "";
    for (var i = 0; i < parts.length - 1; i++) {
        imageName = imageName + parts[i];
    }
    var timestamp = Date.now() + "" + Math.floor(Math.random() * 1000000000);

    return imageName + " " + timestamp + "." + imageExt;
}

const addItemSpec = async (itemId, specKey, specValue) => {
    try {
        var newSpec = await itemSpecModel.create({
            itemId, specKey, specValue
        });

        // console.log(newSpec.specKey + ":" + newSpec.specValue + " added to " + name ); 
    }
    catch (err) {
        console.log(err);
        console.log("error occured at addImageSpec");
    }
}

const addImageInfo = async (itemId, name) => {
    try {
        var newImage = await itemImageModel.create({
            itemId,
            name,
            createdAt: moment().toISOString(true)
        })
    }
    catch (err) {
        console.log(err);
        console.log("error occured at addImageInfo");
    }
}

const homePage = async (req, res) => {
    var items = await itemModel.find({}, { isAvailable: 0, vendorId: 0, __v: 0 }).populate('category', 'name');
    res.status(200).json(items);
}

const addItem = async (req, res) => {
    try {
        const { name, price, category, specs } = req.body;
        const stock = parseInt(req.body.stock);
        if (!(name && price && stock && category)) return res.status(400).send("Enter all mandatory fields");
        
        if(!_.isInteger(stock) || stock < 0) return res.status(400).send({status:false, msg: "stock cannot be set non-Integer or negative"});

        if (specs) var spec = JSON.parse(specs);
        else var spec = {};

        var vendor = req.user;
        var vendorId = vendor._id;

        if (!(await categoryModel.findOne({ _id: category })))
            return res.status(400).send("Wrong category");

        // add item
        var item = await itemModel.create({
            name, vendorId, price, stock, category
        });

        // add specifications
        for (specKey in spec) {
            if (specKey && spec[specKey]) {
                addItemSpec(item._id, specKey, spec[specKey]);
            }
        }
        console.log(req.files);
        // add images
        if (req.files === null) console.log("no images");
        else if (!Array.isArray(req.files.file)) {
            var image = req.files.file;
            var imageName = uniqueName(image.name);

            image.mv(path.join(__dirname, "../../uploads/" + imageName), function (err) {
                if (err) console.log(err);
            });

            addImageInfo(item._id, imageName);
        }
        else {
            for (var image of req.files.file) {
                var imageName = uniqueName(image.name);

                image.mv(path.join(__dirname, "../../uploads/" + imageName), function (err) {
                    if (err) console.log(err);
                });

                addImageInfo(item._id, imageName);
            }
        }

        res.status(201).send(item.name + " is added to the database");
    }
    catch (err) {
        console.log(err);
        res.send("error occured");
    }
}

const updateItem = async (req, res) => {
    try {
        // validations
        const { _id, name, price, stock, category } = req.body;

        if (!(_id && name && price && stock && category))
            return res.status(400).send("enter all necessary data");
        
        if(!_.isInteger(stock) || stock < 0) return res.status(400).send({status:false, msg: "stock cannot be set non-Integer or negative"});
        // spec validation
        if (req.body.specs) {
            var spec = JSON.parse(req.body.specs);
            for (let obj of spec) {
                if (!(obj.specKey && obj.specValue)) return res.status(400).send("inappropriate spec info");
            }
        }
        else var spec = [];

        // image validation
        if (req.body.images) {
            var images = JSON.parse(req.body.images);
            for (let obj of images) {
                if (!(obj.name)) return res.status(400).send("enter Image info");
            }
        }
        else var images = [];

        // item owner validation
        var isItem = await itemModel.findOne({ _id: _id, vendorId: req.user._id });
        if (!isItem) return res.send("you are not authorized to update item or item doesn't exist");

        // item info update
        await itemModel.updateOne(
            { _id: _id },
            {
                $set: { name: name, price: price, stock: stock, category: category }
            }
        );

        // spec updates
        spec.forEach(async (obj) => {
            // console.log(obj._id);
            if (obj._id && await itemSpecModel.findOne({ _id: obj._id, itemId: _id })) {
                var specUpdate = await itemSpecModel.updateOne(
                    { _id: obj._id },
                    {
                        $set: { specKey: obj.specKey, specValue: obj.specValue, isDeleted: obj.isDeleted }
                    },
                    { upsert: true }
                )
            }
            else {
                addItemSpec(_id, obj.specKey, obj.specValue)
            }
        })

        // image updates
        for (let obj of images) {
            if (obj._id && await itemImageModel.findOne({ _id: obj._id, itemId: _id, name: obj.name })) {
                // console.log(obj);
                let image = req.files[obj._id];
                // console.log(image);

                fs.unlink(path.join(__dirname, "../../uploads/" + obj.name), function (err) {
                    if (err) {
                        console.log("error occured");
                        console.log(err);
                        return res.send("error occured while deleting file");
                    }
                    console.log('File deleted!');
                });

                var imageName = uniqueName(image.name);

                image.mv(path.join(__dirname, "../../uploads/" + imageName), function (err) {
                    if (err) console.log(err);
                });

                await itemImageModel.updateOne(
                    { _id: obj._id },
                    {
                        $set: { name: imageName, updatedAt: moment().toISOString(true) }
                    }
                );
            }
            // else{
            //     let image=req.files[obj._id];
            //     var imageName = uniqueName(image.name);
            //     image.mv(path.join(__dirname,"../../uploads/"+imageName) , function(err){
            //         if(err) console.log(err);
            //     });

            //     addImageInfo(_id, imageName);
            // }   
        }

        if (req.files.file) var newImages = req.files.file;
        else var newImages = [];

        for (let image of newImages) {
            var imageName = uniqueName(image.name);
            image.mv(path.join(__dirname, "../../uploads/" + imageName), function (err) {
                if (err) console.log(err);
            });

            addImageInfo(_id, imageName);
        }


        res.send("updated");
    }
    catch (err) {
        console.log(err);
        res.send("error occured");
    }
}

const deleteSpec = async (req, res) => {
    try {
        const { itemId, specId } = req.body;

        if (!(itemId && specId)) return res.send("enter all data");

        var isItem = await itemModel.findOne({ _id: itemId, vendorId: req.user._id });
        if (!isItem) return res.send("you are not authorized to update item or item doesn't exist");

        var isSpec = await itemSpecModel.findOne({ _id: specId, itemId: itemId });
        if (!isSpec) return res.send("spec with given itemId doesnt exist");

        await itemSpecModel.deleteOne({ _id: specId });

        res.send("spec deleted");
    }
    catch (err) {
        console.log(err);
        res.send("error occured");
    }
}

const deleteImage = async (req, res) => {
    try {
        const { itemId, imageId } = req.body;

        if (!(itemId && imageId)) return res.send("enter all data");

        var isItem = await itemModel.findOne({ _id: itemId, vendorId: req.user._id });
        if (!isItem) return res.send("you are not authorized to update item or item doesn't exist");

        var isImage = await itemImageModel.findOne({ _id: imageId, itemId: itemId });
        if (!isImage) return res.send("image with given itemId doesnt exist");

        fs.unlink(path.join(__dirname, "../../uploads/" + isImage.name), function (err) {
            if (err) {
                console.log("error occured");
                console.log(err);
            }
            console.log('File deleted!');
        });

        await itemImageModel.deleteOne({ _id: imageId });

        return res.send("item deleted")

    }
    catch (err) {
        console.log(err);
        return res.send("error occured");
    }
}

const itemDetails = async (itemId) => {
    try {
        var item = await itemModel.aggregate([
            {
                $match: { _id: mongoose.Types.ObjectId(itemId) }
            },
            {
                $lookup: {
                    from: "itemspecs",
                    let: { id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$itemId", "$$id"] },
                                        { $eq: ["$isDeleted", false] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: { itemId: 0, __v: 0, isDeleted: 0 }
                        }
                    ],
                    as: "spec"
                }
            },
            {
                $lookup: {
                    from: "itemimages",
                    let: { id: "$_id" },
                    pipeline: [
                        {
                            $match: {
                                $expr: {
                                    $and: [
                                        { $eq: ["$itemId", "$$id"] },
                                        { $eq: ["$isDeleted", false] }
                                    ]
                                }
                            }
                        },
                        {
                            $project: { itemId: 0, isDeleted: 0, deletedAt: 0, __v: 0 }
                        }
                    ],
                    as: "images"
                }
            },
            {
                $project: { __v: 0 }
            }
        ]);
        await itemModel.populate(item, { path: 'vendorId', select: 'username contactNumber' });

        return item[0];
    }
    catch (err) {
        console.log(err);
        console.log("error occured - itemDetails");
    }
}

const getItem = async (req, res) => {
    try {
        const itemId = req.params.id;

        if (!itemId) return res.send("Enter itemId");
        var item = await itemModel.findOne({ _id: itemId });

        if (!item) return res.send("item doesn't exists");
        item = await itemDetails(itemId);

        res.json(item);
    }
    catch (err) {
        console.log(err);
        res.send("error occured");
    }
}

const deleteItem = async (req, res) => {
    try {
        const itemId = req.body.id;

        if (!itemId) return res.send("enter Id");

        var item = await itemModel.findOne({ _id: itemId, vendorId: req.user._id });
        if (!item) return res.send("Item id doesn't exist");

        await itemModel.deleteOne({ _id: itemId });
        await itemSpecModel.deleteMany({ itemId: itemId });
        await itemImageModel.deleteMany({ itemId: itemId });

        res.send("item deleted");
    }
    catch (err) {
        console.log(err);
        res.send("error occured");
    }
}

const uploadSheet = async (req, res) => {
    // console.log("hello");
    try {
        // console.log(req.files);
        var file = req.files.sheet.data;
        var workbook = xlsx.read(file);
        var sheetNamesList = workbook.SheetNames
        var excelData = xlsx.utils.sheet_to_json(workbook.Sheets[sheetNamesList[0]]);
        var notPushed = [], noName = 0;
        for (let row of excelData) {
            let flag = true;
            if (!_.trim(row.name)) noName++;

            else {
                if (!(row.price && _.isString(row.name) && _.isNumber(row.price))) {
                    notPushed.push({ name: row.name, reason: "some values are missing or not added in correct form" });
                    continue;
                }
                else {
                    // console.log("name:::::::::::",row.name);
                    if (row.spec) {
                        row.spec = row.spec.replace(/:/g, '","specValue":"');
                        row.spec = row.spec.replace(/;/g, '"},{"specKey":"');
                        row.spec = ('[{"specKey":"' + row.spec + '"}]');

                        try {
                            row.spec = JSON.parse(row.spec);
                            var spec = row.spec;

                            for (let obj of spec) {
                                // console.log(obj);
                                if (!(_.trim(obj.specKey) && _.trim(obj.specValue))) {
                                    flag = false;
                                    // console.log("obj::::",_.trim(obj.specKey),":::::",_.trim(obj.specValue));
                                    notPushed.push({ name: row.name, reason: "specs are not given in specified form" });
                                    continue;
                                }
                            }
                        }
                        catch (err) {
                            notPushed.push({ name: row.name, reason: "specs are not given in specified form" });
                            console.log(err);
                            console.log("error occured while parsing excel sheet");
                            continue;
                        }

                        if (flag == true) {
                            let item = await itemModel.create({
                                name: _.trim(row.name),
                                price: row.price,
                                vendorId: "6214a1848402288db5f46afb"
                            });

                            for (let obj of row.spec) {
                                addItemSpec(item._id, _.trim(obj.specKey), _.trim(obj.specValue));
                            }
                        }
                    }
                }
            }
        }
        if (noName != 0) notPushed.push({ name: "error:no name", reason: "total " + noName + " items didn't have any names" })
        var worksheet = xlsx.utils.json_to_sheet(notPushed);
        var newWorkBook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(newWorkBook, worksheet);
        xlsx.writeFile(newWorkBook, './test.xlsx');
        // xlsx.write(newWorkBook, {bookType:'xlsx', type:'array'});
        res.status(200).download("test.xlsx");
    }
    catch (err) {
        console.log(err);
        console.log("error occured at UploadSheet");
        res.status(500).send("some error occured");
    }
}
/* 
const excelJobQueue = async (req,res) => {
    req.setTimeout(50000);
    try{
        const sheets = req.files.sheets;
        console.log("aaaaaaaaa");
        if(Array.isArray(sheets)){
            sheets.forEach(async file => {
                var fileName = uniqueName(file.name);
                await file.mv(path.join(__dirname, "../../uploads/" + fileName), function (err) {
                    if (err) console.log(err);
                    else    console.log("file saved");
                });
                var data = {
                    userid: req.user._id,
                    sheetName: fileName,
                    status: "pending"
                }
                console.log("zzzz");
                await taskQueueModel.create(data);
            })
        }
        else if(typeof sheets == 'object' && typeof sheets != null){
            var fileName = uniqueName(sheets.name);
            sheets.mv(path.join(__dirname, "../../uploads/" + fileName), function (err) {
                if (err) console.log(err);
            });

            var data = {
                userid: req.user._id,
                sheetName: fileName,
                status: "pending"
            }
            console.log("zzzz");
            await taskQueueModel.create(data);
        }

        res.send("done");
    }
    catch(err){
        console.log(err);
        console.log("error occured at excelJobQueue");
        res.status(500).send("Error occured");
    }
} */

const excelJobQueue = async (req,res) => {
    try{

        const sheets = req.files.sheets;
        if(Array.isArray(sheets)){
            sheets.forEach(async file => {
                var fileName = uniqueName(file.name);
                await file.mv(path.join(__dirname, "../../uploads/" + fileName), function (err) {
                    if (err) console.log(err);
                    else    console.log("file saved");
                });
                
                var data = {
                    sheetName: fileName
                }
                queue.add(data);
            })
        }
        else if(typeof sheets == 'object' && typeof sheets != null){
            var fileName = uniqueName(sheets.name);
            sheets.mv(path.join(__dirname, "../../uploads/" + fileName), function (err) {
                if (err) console.log(err);
                else    console.log("file saved");
            });

            var data = {
                sheetName: fileName,
            }

            queue.add(data);
            
        }
        res.send("done");
    }
    catch(err){
        console.log(err);
        console.log("error occured at excelJobQueue");
        res.status(500).send("Error occured");
    }
}

const itemByCategory = async (req, res) => {
    try {
        // console.log(req.params);
        const categoryId = req.params.categoryId;

        if (!categoryId) return res.status(400).send("provide category");

        if (!mongoose.Types.ObjectId.isValid(categoryId)) return res.status(400).send("Invalid Category Id");
        var exists = await categoryModel.findOne({ _id: categoryId });

        if (!exists) return res.status(400).send("category doesnt exists");

        var arrId = [categoryId];
        var arr1 = [];
        while (arrId.length != 0) {
            arr1 = _.concat(arr1, arrId);
            var subcategory = await categoryModel.find({ parent: { $in: arrId } }, { _id: 1 });
            arrId = subcategory.map((obj) => obj._id);
            isItem = null;
        }

        var items = await itemModel.find({ category: { $in: arr1 } }, { name: 1 }).populate('category', 'name parent');

        res.send(items);
    }
    catch (err) {
        console.log(err);
        console.log("error occured at itemByCategory");
        res.status(500).send("some error occured");
    }
}

const newQuery = async (req, res) => {
    try {

        var arr = ["6214a28f8402288db5f46b12", "6214a2be8402288db5f46b22", "6214a2d18402288db5f46b2c"];
        var value = [
            {
                id: "6214a28f8402288db5f46b12",
                price: 100
            },
            {
                id: "6214a2be8402288db5f46b22",
                price: 200
            },
            {
                id: "6214a2d18402288db5f46b2c",
                price: 30
            }];

        let data = await itemModel.update(
            { _id: { $in: arr } },
            [{
                $set: {
                    displayOrder: {
                        $let: {
                            vars: { obj: { $arrayElemAt: [{ $filter: { input: value, as: "kvpa", cond: { $eq: ["$$kvpa.id", "$_id"] } } }, 0] } },
                            in: "$$obj.displayOrder"

                        }
                    }
                }
            }],
            { runValidators: true, multi: true }
        )
    } catch (error) {
        console.log(err);
        res.send("err");
    }
}

module.exports = {
    addItem,
    getItem,
    deleteItem,
    updateItem,
    deleteSpec,
    deleteImage,
    homePage,
    uploadSheet,
    itemByCategory,
    newQuery,
    itemDetails,
    excelJobQueue
}