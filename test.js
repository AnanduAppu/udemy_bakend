const nodemailer = require('nodemailer');
const config = require('./config/configure');
const otpModel = require('./SchemaModel/otp')

// Generate a random verification code
function generateVerificationCode() {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Email setup
const transporter = nodemailer.createTransport({
  service: config.email.service,
  auth: config.email.auth,
});

  const emailVarification = async (req, res) => {
    const { email } = req.body;
    const verificationCode = generateVerificationCode();
    const userOtp = await otpModel.create({ sendto: email, otp: verificationCode });
    
  
    // Send the verification code to the user's email
    const mailOptions = {
      from: config.email.auth.user,
      to: email,
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