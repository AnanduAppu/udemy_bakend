const jwt = require('jsonwebtoken');
const userModel = require('../SchemaModel/users')
const courseModel = require('../SchemaModel/courses');
const { tryCatch } = require("../middleWares/trycatch");


const loginAdmin =  async function (req,res){
    console.log("hellow we are login admin");
    const admin ={username: process.env.Admin_username,
                password: process.env.Admin_password,}

    console.log("adim details",admin)
    const { username,password } = req.body;
    
    
    const validator = password === admin.password && username ===admin.username?true:false;

    
    if(!validator){
        res.status(400).send("validation failed: incorrect username or password");
        return;
       };
       
       const accessToken = jwt.sign({ username: username }, process.env.secretKey, { expiresIn: '1h' });
      console.log(accessToken);
    
  
     
      res.cookie("adminAuth", accessToken,);

      const token = req.cookies.adminAuth;

      if(!token){
        return res.status(400).json({
          success:false,
          message: "cookie issue",
        })
      }
      console.log("Login successful");
      res.status(200).json({
        success: true,
        message: "Successful login",
        accessToken,
      
      });

} 




const totalData = tryCatch(async(req,res)=>{
    const userData = await userModel.find();
   const CourseData = await courseModel.find()
    const totalUser = userData.length;
    const totalCourse = CourseData.length
    var totalOrder = 0
    var totalProfit = 0

    for (const user of userData) {
        const populatedUser = await user.populate('orders')
        const orders = populatedUser.orders;
        totalOrder += orders.length; // to get total order what usermake
        for (const order of orders) {
            totalProfit += parseFloat(order.price); // to get total revenew what we get from all orders 
            
        }

    }

    console.log('Total User:', totalUser);
    console.log('Total Order:', totalOrder);
    console.log('Total Profit:', totalProfit);

res.status(200).json({
    Data:{totalUser,
    totalOrder,
    totalProfit,
    totalCourse,userData,CourseData},
    
    success:true,

})
});




//
const AdmincourseEdit = tryCatch(async (req, res) => {
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

const userEdit = tryCatch(async(req,res)=>{
    const {userId}=req.body;

    const userCheck = await userModel.findById({userId});

    if (!userCheck) {
        res.status(200).send("no user available")
    }

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

        if(!updatedUser){
            res.status(200).send("not updated")
        }

      res.status.json({
        message:"successfully edited ",
        success:true
      })

});

const DeleteCourse = tryCatch(async(req,res)=>{
    const { courseId } = req.body;
    const deletedCourse = await courseModel.deleteOne({ _id: courseId });
    if (deletedCourse.deletedCount === 1) {
        
        return res.status(200).json({ message: 'Course deleted successfully' });
    } else {
    
        return res.status(404).json({ error: 'Course not found' });
    }
});

module.exports={
    loginAdmin,
    totalData,
    AdmincourseEdit,
    userEdit ,
    DeleteCourse
}