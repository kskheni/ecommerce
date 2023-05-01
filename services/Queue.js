const _ = require("lodash");
const { fork } = require("child_process");
const path = require("path");

class Queue{
    constructor() {
        this.items = [];
        this.flag = 0
        this.maxFlag = 1;
    }

    peek(){
        if(this.items.length > 0 ){
            return this.items[0];
        }
    }

    process(data){
        console.log("process start");
        try{
            var filePath = path.join(__dirname, "../uploads/"+data.sheetName);

            const child = fork("./services/child_process.js");            
            child.on("message", (childRes) => {
                process.kill(childRes.pid);
                console.log("process end");
                this.pop();
            });
            child.send({ filePath, pid: child.pid });
            console.log("--------");
        }
        catch(err){
            console.log(err);
            console.log("error occured in Job Process");
        }
    
    }

    add(obj){
        // console.log("add");
        this.items.push(obj);

        this.isEmpty();

        if(this.flag < this.maxFlag){
            this.flag = this.flag + 1;
            this.process(this.peek());
        }
    }

    pop(){
        // console.log("pop");
        if(this.items.length > 0){
            this.items.shift();
        }
        if(this.items.length > 0){
            this.process(this.peek());
        }
        else{
            this.flag = this.flag - 1;
        }
        this.isEmpty();

    }

    isEmpty(){
        if(this.items.length == 0){
            console.log("Queue is Empty!!!!");
        }
    }
}

module.exports = { Queue };