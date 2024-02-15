const mongoose = require("mongoose");


const dbConnection=()=>{

    mongoose.connect(process.env.DB_URI)
    .then(()=>console.log("successfully connected to mongodb")).catch((err)=>console.log(err))
};

module.exports = dbConnection