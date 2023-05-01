const SPTransModel = require("../models/tmpSPTrans");
const xlsx = require("xlsx");
const fs = require("fs");
const mongoose = require("mongoose");

const saveExcel = async (filePath) => {
    try{
        console.log("start");
        await mongoose.connect(process.env.uri, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        }).catch((err) => { console.log(err); });
            
        var workbook = xlsx.readFile(filePath);
        // console.log("file read from local storage");
        var excelData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // console.log("JSON fetched");
        await SPTransModel.insertMany(excelData);
              
        fs.unlink(filePath, function (err) {
            if (err) {
                console.log("error occured");
                console.log(err);
            }
            // console.log('File deleted!');
        });
        console.log("end");
        return true;
    }
    catch(err){
        console.log(err);
        console.log("error in saveExcel");
        return false;
    }
}

process.on('message', async (data) => {
    // console.log("inside child process, hooray!!!!!!!",filePath);
    await saveExcel(data.filePath);
    process.send({msg:"task completed", pid:data.pid});
})
