const express = require("express");
const app = express();
const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
const fileUpload = require("express-fileupload");

const cors = require("cors");
const options = {
    origin: "*",
    optionsSuccessStatus: 200
}
app.use(cors(options));

app.use(fileUpload());
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

const staticPath = path.join(__dirname, 'uploads');
const viewsPath = path.join(__dirname, 'views');
app.use(express.static(staticPath));
app.set('view engine', 'ejs');
app.set('views', viewsPath);

mongoose.connect(process.env.uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
    .then(() => { console.log("connection successful"); })
    .catch((err) => { console.log(err); });

var router = require("./routes/user");
app.use("/", router);

app.listen("5000", () => { console.log("listening to port 5000"); });