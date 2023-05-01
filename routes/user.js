const express = require("express");
const router = express.Router();
const authMid = require("../middlewares/Auth");
const userController = require("../controllers/user");
const orderController = require("../controllers/user/order");
const couponController = require("../controllers/vendor/coupon");
const itemController = require("../controllers/vendor/item");
const categoryController = require("../controllers/admin/category");
const cartController = require("../controllers/user/cart");
const walletController = require("../controllers/wallet/wallet");
const Queue = require("bull");
const tempModel = require("../models/tmpSPTrans");

/* 
const sendSMSQueue = new Queue('sendSMS', {
    redis: { port: process.env.REDIS_PORT, host: process.env.REDIS_HOST }
});
sendSMSQueue.process(async (job, done) => {
    console.log(new Date().getSeconds());
    done();
});
var data = {
    to: "kkheni11@gmail.com",
}
const options = {
    delay: 3000, // 1 min in ms
    attempts: 2
};

setTimeout(() => sendSMSQueue.add(data,options),1000)
setTimeout(() => sendSMSQueue.add(data,options),1000)
setTimeout(() => sendSMSQueue.add(data,options),1000)
setTimeout(() => sendSMSQueue.add(data,options),1000)
setTimeout(() => {console.log(new Date().getSeconds()); sendSMSQueue.add(data,options)},5000)
 */


router.get("/tempAPI", async (req, res) => {
    await tempModel.find({"Place Of Supply":"Gujarat"});
    res.send("user");
})

router.get("/placeOrder", (req, res) => res.render("placeOrder"))

// category
router.post("/getCategory", categoryController.getCategory); // returns immediate child categories 
router.post("/category:categoryId", itemController.itemByCategory); // returns items within a category
router.post("/addCategory", authMid("manageCategory"), categoryController.addCategory); // adds new category or subcategory depending on req body
router.post("/removeCategory", authMid("manageCategory"), categoryController.removeCategory); // removes category if no items exist in it
router.post("/updateCategory", authMid("manageCategory"), categoryController.updateCategory); // updates category info(name and parent) based on id

// items
router.post("/", itemController.homePage); // returns all items
router.post("/item/:id", itemController.getItem); // returns all details of item(spec, images, vendor details)
router.post("/addItem", authMid("item"), itemController.addItem);
router.post("/deleteItem", authMid("item"), itemController.deleteItem); // working
router.put("/updateItem", authMid("item"), itemController.updateItem); // 
router.put("/deleteSpec", authMid("item"), itemController.deleteSpec);
router.put("/deleteImage", authMid("item"), itemController.deleteImage);
router.post("/uploadSheet", itemController.uploadSheet);
router.post("/newQuery", itemController.newQuery);
router.post("/excelQueue", authMid("item"), itemController.excelJobQueue);

// coupons
router.get("/coupon", couponController.getCoupon);
router.get("/comboCoupon", couponController.getComboCoupon);
router.post("/addcoupon", authMid("manageCoupon"), couponController.addcoupon);
router.post("/comboCoupon", authMid("manageCoupon"), couponController.addComboCoupon);
router.post("/buyCoupon", authMid("buyCoupon"), orderController.buyCoupon);
router.post("/buyComboCoupon", authMid("buyCoupon"), orderController.buyComboCoupon);
router.post("/myCoupons", authMid("myCoupon"), couponController.myCoupons);

// login-Signup
router.post("/signup", userController.register);
router.post("/login", userController.login);

// order
router.post("/placeOrder"/* , authMid("placeOrder") */, orderController.placeOrder); // change userId and set to req.user._id after adding the auth middleware 
router.post("/verifySignature"/* , authMid("placeOrder") */, orderController.verifySignature);
router.post("/query", orderController.query);
router.post("/invoice", authMid("placeOrder"), orderController.invoice);

// cart
router.post("/cart/add", authMid("manageCart"), cartController.addToCart);
router.post("/cart/remove", authMid("manageCart"), cartController.removeFromCart);
router.post("/cart/update", authMid("manageCart"), cartController.updateCart);
router.post("/cart", authMid("manageCart"), cartController.getCart);

// wallet
// router.post("/wallet/create", walletController.createWallet);
router.post("/addToWallet", authMid("wallet"), walletController.addToWallet);
router.post("/sendToWallet", authMid("wallet"), walletController.sendToWallet);

/* 
// noAuth/common Routes
router.post("/signup", userController.register);
router.post("/login", userController.login);

router.post("/", itemController.homePage);
router.post("/item/:id",itemController.getItem);
router.post("/getCategory", categoryController.getCategory);
router.post("/category:categoryId", itemController.itemByCategory);
router.post("/coupons", couponController.getCoupons);
router.post("/comboCoupons", couponController.getComboCoupon);


// Vendor Routes
router.post("/addItem", authMid("item"), itemController.addItem);
router.post("/addcoupon", authMid("manageCoupon"), couponController.addcoupon);
router.post("/comboCoupon", authMid("manageCoupon"), couponController.addComboCoupon);
router.post("/deleteItem", authMid("item"), itemController.deleteItem);
router.put("/updateItem", authMid("item"), itemController.updateItem);
router.put("/deleteSpec", authMid("item"), itemController.deleteSpec);
router.put("/deleteImage", authMid("item"), itemController.deleteImage);
router.post("/uploadSheet", itemController.uploadSheet);
router.post("/query", orderController.query);

// User Routes
router.post("/placeOrder", orderController.placeOrder );
router.post("/verifySignature", orderController.verifySignature);
router.post("/buyCoupon", authMid("buyCoupon"), orderController.buyCoupon);
router.post("/buyComboCoupon", authMid("buyCoupon"), orderController.buyComboCoupon);

// admin Routes
router.post("/addCategory", authMid("manageCategory"), categoryController.addCategory);
router.post("/removeCategory", authMid("manageCategory"), categoryController.removeCategory);
router.post("/updateCategory", authMid("manageCategory"), categoryController.updateCategory); */

module.exports = router;
