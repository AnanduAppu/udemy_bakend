const userModel = require('../SchemaModel/users')
const { tryCatch } = require("../middleWares/trycatch");
const bycrypt =require("bcrypt");
const otpModel = require("../SchemaModel/otp")
const { signAccessToken } = require("../middlewares/jwt");
const twilio = require('twilio');
const nodemailer = require('nodemailer');
const config = require('../config/configure');
const reviewModel = require('../SchemaModel/Review')
const jwt = require('jsonwebtoken')

 



//otp sending
const accountSid = 'AC0efff13f183740a31f12679cf248c718';
const authToken = '087af153a102d7c3437e0c67cd763515';
const client = twilio(accountSid, authToken);

const generatedOtp = () => {
    return Math.floor(100000 + Math.random() * 900000)
}

const PhonesendOTP = async (req, res) => {
    const userPhoneNumber = req.body.phone;
    try {
        const otp = generatedOtp();
        const userOtp = await otpModel.create({ sendto: userPhoneNumber, otp: otp });
        const phoneOtp = jwt.sign(otp,process.env.secretKey)
        const message = await client.messages.create({
            body: `Your OTP is: ${otp}`,
            from: '+12037174991',
            to: `+${userPhoneNumber}`,
        });

        res.cookie("userOtp", phoneOtp)
        console.log(`OTP sent to ${userPhoneNumber}: ${message.sid}`);
        res.status(200).json({ message: 'OTP sent successfully', userOtp });

    } catch (error) {
        console.error('Error sending OTP:', error);
        res.status(500).json({ message: 'Failed to send OTP' });
    }
};


//user Registration


const userRgistration = tryCatch(async function (req,res){
      
        console.log(req.body);

        const { userData } = req.body;
        const { name, email, phone, password } = userData;
   
        console.log(email);   
        const existinguser = await userModel.findOne({email:email});
        console.log(existinguser);
        if (existinguser) {
            return res.status(400).json({message:"user already exist"})
        }

        try {
            const userSave = await userModel.create(req.body.userData);
            console.log(userSave);
        
            res.status(202).json({
            success:true,
     
            userSave
           
          })
            
          } catch (error) {
            console.error('Error deleting OTP:', error);
            return res.status(500).json({ message: 'Internal Server Error' });
          }
});


//register with email
const emailRegistration = tryCatch(async(req,res)=>{
  const {Enteredemail} = req.body
  console.log(Enteredemail)
  const existinguser = await userModel.findOne({email:Enteredemail});
  console.log(existinguser)
 
  if (existinguser) {
      return res.status(400).json({message:"user already exist",status:false})
  }
res.status(200).json({message:"create password",status:true})
})





//register account with email by setting password
const emailRegPasswordSetting = tryCatch(
  async (req, res) => {
    const { name, email, password } = req.body;

   
    console.log(name);
    const userSave = await userModel.create(req.body);
 
    const accessToken = await signAccessToken({
      email: userSave.email,
      name:userSave.name,
      id: userSave._id,
    
    });

    res.cookie("token", accessToken,)
    console.log(userSave);
    res.status(200).json({ message: "your account created", status: true });
  },
);





//login page
const loginform = tryCatch( async (req,res)=>{
  const { email, password } = req.body;
  const checkUser = await userModel.findOne({ email: email });
    console.log(checkUser);

    if (!checkUser) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log(checkUser.password)
     
    const result = await bycrypt.compare(password,checkUser.password)
      if (!result) {
          res.status(401).json({
              success:false,
              message:"password is failed"
          })
      }
   
  

    const accessToken = await signAccessToken({
      email: checkUser.email,
      name:checkUser.name,
      id: checkUser._id,
      phone:checkUser.phone
    });
    console.log(accessToken);
    console.log("Login successful");

    
   
    res.cookie("token", accessToken,)
    
    res.status(200).json({
      success: true,
      message: "Successful login",
      accessToken,
      userid:checkUser.id
    });
});

//login with email (google auth)
const emailLogin = async(req,res)=>{
  const {Enteredemail} = req.body

  try {
    const existinguser = await userModel.findOne({email:Enteredemail});
    if (!existinguser) {
      return res.status(400).json({message:"user not exist",success:false})
  }
  const accessToken = await signAccessToken({
    email: existinguser.email,
    name:existinguser.name,
    id: existinguser._id,
    phone:existinguser.phone
  });

  res.cookie("token", accessToken)

  res.status(200).json({
    success: true,
    message: "Successful login",


  });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error", success: false });
  }

}



//forgot password email varification 

const transporter = nodemailer.createTransport({
    service: config.email.service,
    auth: config.email.auth,
  });
  

const emailVarification = async (req, res) => {
    const { email:userEmail } = req.body;
    const verificationCode = generatedOtp();
   
    const existinguser = await userModel.findOne({email:userEmail});
    
    if (!existinguser) {
        return res.status(400).json({message:"user not exist"})
    }
   
    
    const userOtp = await otpModel.create({ sendto: userEmail, otp: verificationCode });
    existinguser.varified = false;
    const updateuser = await userModel.create(existinguser)
    console.log(updateuser);
    // Send the verification code to the user's email
    const mailOptions = {
      from: config.email.auth.user,
      to: userEmail,
      subject: 'Forgot Password - Verification Code',
      text: `Your verification code is: ${verificationCode}`,
    };
  
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Failed to send verification code');
      }
      
      res.status(200).json({ message: 'OTP sent successfully', userOtp });
    });
  };




  // email otp varified for forgot password
  const emailvarified = tryCatch(async(req,res)=>{
    const {emailCode:userEnteredOTP } = req.body;

    const userEmailOtp = await otpModel.findOne({otp:userEnteredOTP});

    if (userEmailOtp) {
      await userModel.updateOne(
        { email: userEmailOtp.sendto },
        { $set: { varified: true } }
        );

        var result = await otpModel.deleteOne({ otp: userEnteredOTP });

        res.status(200).json({ message: true,success:"otp varified",userEmail:userEmailOtp.sendto,result  });
      
    }else{
      res.status(400).json({message:false})
    }
  
  })


  // set new password after email varification
  const setNewpassword = tryCatch(async(req,res)=>{

    const {userEmail,newPassword } = req.body;

    const hashedPassword = await bycrypt.hash(newPassword, 10);
    console.log(newPassword);
    const userEmailData = await userModel.findOne({email:userEmail})
    if(userEmailData && userEmailData.varified===true){
      await userModel.updateOne(
        { email: userEmail },
        { $set: { password: hashedPassword } }
        );

        res.status(200).json({ message: true,success:"password changed successful" });
    }else{

      res.status(400).json({message:false})

    }
   
  })





// email verification for registration
  const emailVerificationRegistration = tryCatch(async(req,res)=>{
    

    const  {email}  = req.body;

    console.log(email)
    const userOtp = generatedOtp();
 
     const emailOtp = jwt.sign(userOtp,process.env.secretKey)
     
  
    console.log("the otp is ",emailOtp)
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
      
      subject: 'Account Verification Code',
      text: `Your verification code is: ${userOtp}`,
    };
    console.log("the otp is ww")
    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.error(error);
        
        return res.status(500).send('Failed to send verification code');
      }
      
      res.cookie('userOtp',emailOtp)
      res.status(200).json({ message: 'OTP sent successfully', userOtp });
    });
  })



// clearing cookies for logout 
const logOut = tryCatch(async(req, res) => {
  res.clearCookie('token');
  res.send('Cookie cleared successfully');
})



//*user data taking by useeffect everytime
const userAccess = tryCatch(async(req,res)=>{
  const Useremail  = req.body.email;
  console.log(Useremail)
  const existingUser = await userModel.findOne({ email:Useremail});
  const token = req.cookies.token;

  console.log(token)

  if (!existingUser ) {
    
    return res.status(401).json({ successful: false, error: "Unauthorized" });
  }

  res.status(200).json({
    Data: existingUser,
    successful: true
  });

})


/// user profile image update 

const userImage = tryCatch(async(req,res)=>{
  const { imageUrl, email } = req.body;

  console.log(imageUrl);
  console.log(email);

  const existingUser = await userModel.findOneAndUpdate(
    { email },
    { $set: { profileimg: imageUrl } }
  );
  console.log(existingUser);

  if (!existingUser) {
    return res.status(401).json({ successful: false, error: "Unauthorized" });
  }


 res.status(200).json({ successful: true, message: "Image updated", Data: existingUser.profileimg });
})





// user profile update 
const updateUser = tryCatch(async (req, res) => {
  const { userDetails, userData } = req.body;
  const userId = userData._id;

 
  const updatedUser = await userModel.findByIdAndUpdate(
    userId,
    {
      $set: {
        name: userDetails.name || userData.name,
        phone: userDetails.phone || userData.phone,
        email: userDetails.email || userData.email,
      },
    },
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return res.status(400).send("User does not exist");
  }

  console.log(updatedUser)
  res.status(200).json({
    successful: true,
    message: updatedUser,
  });
});









// user profile lecture video uploading
const lectureVideoCreating = tryCatch(async(req,res)=>{
 const {videoData,userData} = req.body;
   

 const {instructor,title,description,videos, thumpline:thumbnail,category,price}=videoData

 console.log(userData._id)

 const exisCourse = await courseModel.findOne({ title });

 if (exisCourse) {
   res.status(400).json({
   
     successful: false,
     message: "The course title already exists",
    
   })

  }
 
 const exisUser = await userModel.findOne({_id:userData._id })

 if(!exisUser){
  res.status(400).json({
    successful:false,
    message:"user not found it "
  })
 

}else{
  console.log("what is that");

  const createCourse = await courseModel.create({
    instructor:userData._id,
    title,
    description,
    videos, 
    thumbnail,
    category,
    price});

    if(createCourse){
      console.log("created",createCourse);
     await userModel.updateOne({_id:userData._id},{ $push: { mylecture: createCourse._id } })
     
    res.status(200).json({
      successful:true,
      message: "course created",
      Data: exisUser.mylecture
    })
    }else{
      res.status(400).json({
        successful:false,
        message: "course not created",
       
      })
    }
}

})
// user profile lecture video uploading code end here



//course display in userprofile
const LectureVideoShowing = tryCatch(async (req, res) => {
  const  {id}  = req.headers;


  const exisUser = await userModel.findOne({ _id: id }).populate('mylecture');
 
  if (!exisUser) {
    return res.status(400).json({
      successful: false,
      message: "User not found",
    });
  }
  const lectureData = exisUser.mylecture

  // Only send the response if the user is found
  res.status(200).json({
    successful: true,
    message: "User found",
    Data:lectureData 
  });
});;




// user Cart adding
const userCartAdding = tryCatch(async (req, res) => {
  console.log("we are cart adding function");
  const { courseId, userData } = req.body;

  const existUser = await userModel.findOne({ _id: userData._id });
  console.log(existUser);
  console.log("user checking");
  if (!existUser) {
    return res.status(400).json({
      successful: false,
      message: "User not found",
    });
  }

  console.log("user checked");
  const addCart = await userModel.updateOne({ _id: userData._id }, { $push: { cart: courseId } });

  res.status(200).json({
    successful: true,
    message: "cart item added",
  });
});



//user cart showing
const userCartShow = tryCatch(async(req,res)=>{

  console.log("taking data")
   const id = req.params.id;
  console.log("we are cart showing function ")
  const existUser = await userModel.findOne({ email:id}).populate('cart');

  if (!existUser) {
    return res.status(400).json({
      successful: false,
      message: "User not found",
    });
  }

  const cart = existUser.cart
  const length = cart.length
 
  res.status(200).json({
    successful: true,
    message: "User found",
    Data:cart,
    additional:length
  });

})


//user cart item removing
const removeCartItems = tryCatch(async(req,res)=>{
  console.log(`we are cart remover item fucntion name:'removeCartItems'`)
const {courseId,userData} = req.body;

const existUser = await userModel.findOne({ _id:userData._id })
if (!existUser) {
  return res.status(400).json({
    successful: false,
    message: "User not found",
  });
}

const removeCartItem = await userModel.updateOne(
  { _id: userData._id },
  { $pull: { cart: courseId } }
);

res.status(200).json({
  successful:true,
  message: "cart item removed",
  Data:removeCartItem
})

})

//user adding to wishlist 
const userWishListAdd= tryCatch( async(req,res)=>{

  console.log("we are cart adding function")
  const {courseId,userData} = req.body

  const existUser = await userModel.findOne({ _id:userData._id })
  console.log("user checking")
  if (!existUser) {
    return res.status(400).json({
      successful: false,
      message: "User not found",
    });
  }

  const existingLectureCourse = existUser.mylecture.find((ele) => ele === courseId);
  const existingLernigCourse = existUser.mylearnings.find((ele) => ele === courseId);

  if (existingLectureCourse || existingLernigCourse) {
    return res.status(200).json({
      successful: true,
      message: "Course already exists in your profile",
    });
  }

  console.log("user checked")
    const addWish =  await userModel.updateOne({_id:userData._id},{ $push: {wishlist: courseId } })



  res.status(200).json({
    successful:true,
    message: "Wishlist item added",
 
  })
})


// wihslist item showing
const userWishlistShow = tryCatch(async(req,res)=>{


  const id = req.params.id;

  const existUser = await userModel.findOne({ email:id}).populate('wishlist');

  if (!existUser) {
    return res.status(400).json({
      successful: false,
      message: "User not found",
    });
  }

  const wishlist = existUser.wishlist
  const length = wishlist.length
 
  res.status(200).json({
    successful: true,
    message: "User found",
    Data:wishlist,
    additional:length
  });

})


//remove items from wishlist
const removeWishItems = tryCatch(async(req,res)=>{
  console.log(`we are cart remover item fucntion name:'removeWishItems'`)
const {courseId,userData} = req.body;

const existUser = await userModel.findOne({ _id:userData._id })
if (!existUser) {
  return res.status(400).json({
    successful: false,
    message: "User not found",
  });
}

const removeWishItem = await userModel.updateOne(
  { _id: userData._id },
  { $pull: { wishlist: courseId } }
);

res.status(200).json({
  successful:true,
  message: "WishItem removed",
  Data:removeWishItem
})

});


//*course section starts here 

const courseModel = require('../SchemaModel/courses')

//course display all courses
const displayCourses = tryCatch(async(req,res)=>{
  const allCourse = await courseModel.find();

  if(!allCourse){
      res.status(400).send("courses not available")
  }


  res.status(200).json({
    Data:allCourse,
    message:"sussfully get the courses",
    success: true
  })
})

// getting intsructor detail from data base
const courseView = tryCatch(async(req,res)=>{
  const { instructorId } = req.body;
  const existUser = await userModel.findOne({ _id:instructorId });
  if(!existUser){
    res.status(400).send("user not available")
};

res.status(200).json({
  DataName:existUser.name,
  DataEmail:existUser.email,
  message:"Successfully retrieved the user data",
  success: true
})

})


//my lecture course text editing 
const courseEdit = tryCatch(async (req, res) => {
  const { courseId, formData } = req.body;

  const checkCourse = await courseModel.findOne({ _id: courseId });

  if (!checkCourse) {
    return res.status(400).send("Course does not exist");
  }

  const courseUpdate = await courseModel.findByIdAndUpdate(
    courseId,
    {
      $set: {
        title: formData.title || checkCourse.title,
        description: formData.description || checkCourse.description, // Corrected typo here
        price: formData.price || checkCourse.price
      },
    },
    { new: true, runValidators: true }
  );

  res.status(200).json({
    message: "Successfully edited",
    success: true
  });
});


//my lecture course video(class) uploading
const courseVideoUpload= tryCatch(async(req,res)=>{
  const {courseId, newVideos} = req.body;

  console.log(newVideos)


  const checkCourse = courseModel.findOne({ _id:courseId });

  if(!checkCourse){
    res.status(400).send("course not exist")
};

const addtoCourse = await courseModel.updateOne(
  { _id: courseId },
  { $push: {  videos: { $each: newVideos } } } 
);


res.status(200).json({

  message:"Successfully uploaded",
  success: true
})



});


// delete the course we created

const courseDelete = tryCatch(async(req,res)=>{
  const {courseId} = req.body;
  const deletedCourse = await courseModel.findOneAndDelete({ _id: courseId });
    
  if (!deletedCourse) {
    return res.status(400).send("Course not found");
  }

  res.status(200).json({
    message:"Course deleted successfully",
    success: true
  })
})

const videohandle = tryCatch(async(req,res)=>{

const videodata = req.body
const videofiles = videodata.videos
console.log("the data",videofiles)

const accesstoken = await signAccessToken(videofiles)

res.cookie("tokenVideo", accesstoken)

res.status(200).json({
  success:true
})


})
// //*order and payment 

const Razorpay = require('razorpay');



const RapayCreatingId = tryCatch(async (req, res) => {
        console.log("what happening")
        const {amount,userData} = req.body;
        const userId = userData._id

        console.log(userId)
      
        const userCheck = await userModel.findById(userId);

        if (!userCheck) {
          return res.status(404).json({
            success: false,
            message: "User not valid"
          });
        }
        console.log("checked user successfully")
        const usercart = await userModel.findOne({_id:userId}).populate('cart');

     const cart = usercart.cart
        
        if (cart.length === 0) {
          return res.status(404).json({
            success: false,
            message: "You have to add products to the cart"
          });
        }
        console.log("cart checked successfully")

        const totalPrice = cart.reduce((acc, cart) => acc + parseFloat(cart.price), 0).toFixed(2);


        console.log(totalPrice)
        console.log("hellow")
        if (totalPrice == amount) { 

          const razorpay = new Razorpay({
            key_id: process.env.keyid,
            key_secret: process.env.key_secret
          });
       
          const options = {
            amount: amount * 100,
            currency: "INR",
            receipt: "order_rcptid_11"
          };
          
          const order = await razorpay.orders.create(options);

          
          return res.status(200).json({
            successful: true,
            message: `You successfully paid ${totalPrice}`,
            Data:order.id
          });
        } else {
          res.status(400).send("Enter correct amount");
        }
});


/// order orderfull filled
const orderFullfill = tryCatch(async (req, res) => {
  console.log("hellow orderfull fill 1");
  const { userData } = req.body;
  const userId = userData._id;
  console.log(userId);
  
  const userCheck = await userModel.findById(userId);
  console.log("hellow orderfull fill 2");
  
  if (!userCheck) {
    return res.status(400).send("User does not exist");
  }

  console.log("hellow orderfull fill 3");
  const cart = userCheck.cart;

  // Unset the cart from the user document
  const cleanCart = await userModel.updateOne(
    { _id: userData._id },
    { $unset: { cart: "" } } // Use empty string to unset the field
  ); 

  // Add the cart items to the orders field
  const orderAdding = await userModel.updateOne(
    { _id: userData._id },
    { $push: { orders: { $each: cart } } } 
  );

  //adding to mylearning
  const addtoLearn = await userModel.updateOne(
    { _id: userData._id },
    { $push: { mylearnings: { $each: cart } } } 
  );

  console.log("hellow orderfull fill 4");

  return res.status(200).json({
    successful: true,
    message: `Order placed successfully`,
    Data: userCheck.orders
  });
});

//after order fullfill that courses all goes to the my learning section in order to user to study it
const mylearnings = tryCatch(async (req, res) => {
  const id = req.headers.id;
console.log("hellow")
  console.log(id)
  const existUser = await userModel.findOne({ _id: id }).populate('mylearnings');
  
  if (!existUser) {
    return res.status(400).send("User does not exist");
  }

  const mylearning = existUser.mylearnings;

  if (mylearning.length === 0) {
    return res.status(404).json({
      success: false,
      message: "No courses in my learings"
    });
  }
 

  res.status(200).json({
    Data: mylearning,
    successful: true 
  });
});


//course delete from myleccture
const DeleteCourseMylecture = tryCatch(async (req, res) => {
  const { courseId, userId } = req.body;

  const deletedCourse = await courseModel.deleteOne({ _id: courseId });

  if (deletedCourse.deletedCount === 1) {
    
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      { $pull: { mylecture: courseId } }, 
      { new: true } 
    );

    if (updatedUser) {
      return res.status(200).json({ message: 'Course deleted successfully', success:true });
    } else {
      return res.status(404).json({ error: 'User not found' });
    }
  } else {
    return res.status(404).json({ error: 'Course not found' });
  }
});


// review post 
const reviewPost = tryCatch(async(req,res)=>{

  const { review, id, courseId } = req.body;

  console.log(review, id, courseId)
  const existUser = await userModel.findOne({ _id: id });
  const checkCourse = await courseModel.findOne({ _id: courseId });

  if (!existUser && !checkCourse) {
    return res.status(400).send("User or course does not exist");
  }

  console.log("we created review in ",id)
  const newReview = await reviewModel.create({
    reviewer: id,
    comment: review
  });

    const reviewId = newReview._id; 
    
    const updateCourse = await courseModel.updateOne(
      { _id: courseId },
      { $push: { Review: reviewId } }
    );

    res.status(200).json({
      message:"review posted",
      success:true
    })
})


const showReview = tryCatch(async(req,res)=>{
  const {id} = req.headers // reviewshow carrying course id

  const findReview = await courseModel.findOne({ _id: id}).populate({
    path: 'Review',
    populate: {
      path: 'reviewer',
      model: 'userData' // Assuming your user schema is named 'userData'
    }
  });
if (!findReview){
  res.status(400).send("course not found")
};

const review = findReview.Review;

console.log(review)

if(review.length === 0){
  res.status(204).json({
    message:"no reviews",
    success:false
  })

  return
}

res.status(200).json({
  message:"successful",
  review,
  success:true
})
 
})



  module.exports={
    userRgistration,
    loginform,
    PhonesendOTP,
    emailVerificationRegistration,
    emailVarification,
    emailvarified,
    setNewpassword ,
    emailRegistration,
    emailRegPasswordSetting,
    emailLogin,
    logOut,


    userImage,
    userAccess,
    updateUser,
    displayCourses,
    lectureVideoCreating,
    LectureVideoShowing,
    userCartAdding,
    userCartShow,
    removeCartItems,
    userWishListAdd,
    userWishlistShow,
    removeWishItems,
    courseView,
   



    RapayCreatingId,
    orderFullfill,
    courseEdit,
    courseVideoUpload,
    courseDelete,
    mylearnings,
    DeleteCourseMylecture,



    reviewPost,
    showReview,



    videohandle


}
