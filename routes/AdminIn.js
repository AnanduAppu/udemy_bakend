const express = require("express");
const router = express();
const AdminForm = require('../controller/adminForm');




router.route("/admin/login").post(AdminForm.loginAdmin);
router.route("/admin/status").get(AdminForm.totalData);
router.route("/admin/courseEdit").get(AdminForm.AdmincourseEdit);





module.exports = router;