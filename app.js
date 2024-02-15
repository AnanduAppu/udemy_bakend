const express = require("express");
const errorhandler = require("./middlewares/errorhandler")
const cors = require("cors")
const cookies = require("cookie-parser")
const app = express();

app.use(express.json())

app.use(cookies());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}));

//user area
const routeSingUp = require("./routes/userData");
app.use("/user",routeSingUp);


//Admin area
const routeAdminIn = require("./routes/AdminIn");
app.use("/user",routeAdminIn);

app.use(errorhandler)

module.exports = app;