const path = require("path");
const Queue = require("bull");
const { fork } = require("child_process");



/*
const redisServer = {
    redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST }
}
const jobQueue = new Queue('jobQueue', redisServer);

const jobProcess = async (job, done) => {
    try{
        var filePath = path.join(__dirname, "../uploads/"+job.data.sheetName);
        
        console.log("=================Save Excel called=================");
        
        const child = fork("./services/child_process.js");
        
        child.on("message", (childRes) => {
            console.log("Message received from child:", childRes.msg);
            console.log(childRes);
            process.kill(childRes.pid);
        });
        
        child.send({
            filePath, 
            pid: child.pid
        });
        console.log(":::::::::::::::::Save Excel returned:::::::::::::::::");

        done();
    }
    catch(err){
        console.log(err);
        console.log("error occured in Job Process");
    }
}

const initJob = () => {
    jobQueue.process(jobProcess);
}

initJob();
*/


/* const worker = async () => {
    try{
        var pendingSheets = await taskQueueModel.find({status: "pending"});
        var sheetIds = pendingSheets.map(sheet => sheet._id);

        await taskQueueModel.updateMany(
            { _id: { $in: sheetIds }},
            { status: "under work" }
        );

        console.log(sheetIds);
        // return true;
        if(pendingSheets.length == 0)   return true;
        console.log("worker started");
        for(let sheet of pendingSheets){
            var filePath = path.join(__dirname, "../uploads/"+sheet.sheetName);
            var workbook = xlsx.readFile(filePath);
            console.log("11");
            var excelData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
            // console.log("12");
            await SPTransModel.insertMany(excelData);
            fs.unlink(filePath, function (err) {
                if (err) {
                    console.log("error occured in deleting file at worker");
                    console.log(err);
                }
                // console.log('File deleted!');
            });
            // console.log("file uploaded ::::::::::::", sheet.sheetName);
        }


        await taskQueueModel.updateMany(
            { _id: { $in: sheetIds }},
            {status: "completed"}
        );
        // console.log("status Updated");
        console.log("worker ended");

    }
    catch(err){
        console.log(err);
        console.log("error occured in worker function");
    }
}
 */
// cron.schedule('*/3 * * * * *', worker);


/* const redisServer = {
    redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST }
}
const jobQueue = new Queue('jobQueue', redisServer);

const jobProcess = async (job, done) => {
    try{
        console.log("6");

        // console.log(job.data);
        // console.log(path.join(__dirname, "../uploads/"+job.data.sheetName));
        // console.log("Processing file ---- ", job.data.sheetName, " ----");
        // var workbook = xlsx.readFile(filePath);
        // var excelData = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
        // console.log(excelData);
        // await SPTransModel.insertMany(excelData);
        // console.log("Data Stored from sheet ", job.data.sheetName, ":::::::::::::::::::::::  Length: ", excelData.length); 
        
        var filePath = path.join(__dirname, "../uploads/"+job.data.sheetName);
        console.log("7");
        console.log("hello");


    //    fs.unlink(filePath, function (err) {
    //         if (err) {
    //             console.log("error occured");
    //             console.log(err);
    //         }
    //         console.log('File deleted!');
    //     });

        saveExcel(job.data, filePath);
        console.log("8");
        done();
    }
    catch(err){
        console.log(err);
        console.log("error occured in Job Process");
    }
}
*/

/*
// 1,39,198  139198
const initJob = () => {
    jobQueue.process(jobProcess);
}

initJob(); */