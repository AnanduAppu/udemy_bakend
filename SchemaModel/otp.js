const mongoose = require("mongoose");

const otpschema = mongoose.Schema({
    sendto:String,
    otp:String
})


module.exports = mongoose.model("otp",otpschema)