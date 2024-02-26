const express = require('express');
const router = express();
const authentication = require("../middlewares/authentication")
const userForm = require("../controller/userform");



router.route("/signup").post(userForm.userRgistration);
router.route("/login").post(userForm.loginform);
router.route("/Phoneotpsend").post(userForm.PhonesendOTP);
router.route("/Emailotpsend").post(userForm.emailVerificationRegistration);
router.route("/emailvarification").post(userForm.emailVarification);
router.route("/emailOtpvarify").post(userForm.emailvarified);
router.route("/setpasword").post(userForm.setNewpassword);
router.route("/emailResgistration").post(userForm.emailRegistration);
router.route("/emailPasswordSetting").post(userForm.emailRegPasswordSetting);
router.route("/logout").get(userForm.logOut);

router.route("/userimage").post(userForm.userImage);
router.route("/update").post(userForm.updateUser);
router.route("/createcourse").post(userForm.lectureVideoCreating);
router.route("/usercourses").get(userForm.LectureVideoShowing);
router.route("/allcourses").get(userForm.displayCourses);
router.route("/useraccess").post(userForm.userAccess);
router.route("/addToCart").post(userForm.userCartAdding);
router.route("/cartShow/:id").get(userForm.userCartShow);
router.route("/cartItemRemove").post(userForm.removeCartItems);
router.route("/addToWishlist").post(userForm.userWishListAdd);
router.route("/wishlistshow/:id").get(userForm.userWishlistShow);
router.route("/wishItemRemove").post(userForm.removeWishItems);
router.route("/courseView").post(userForm.courseView);
router.route("/payment").post(userForm.RapayCreatingId);
router.route("/ordered").post(userForm.orderFullfill);


// course editing and delete and video upload (update video after you created the course);

router.route("/editCourse").put(userForm.courseEdit);
router.route("/uploadNewVideos").put(userForm.courseVideoUpload);
router.route("/mylearnings").get(userForm.mylearnings);// my learning section showing courses
router.route("/deletecourse").delete(userForm.DeleteCourseMylecture);


// reveiw section
router.route("/addreview").post(userForm.reviewPost);
router.route("/showReview").get(userForm.showReview);



module.exports = router;