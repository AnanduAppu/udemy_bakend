const jwt = require("jsonwebtoken");


module.exports = {
  signAccessToken: (userData) => {
    return new Promise((resolve, reject) => {
      const payload = {userData}
      
      const secret = process.env.secretKey;
      const options = {
        expiresIn: "1hr",
      };
     
      jwt.sign(payload, secret, options, (err, token) => {
        if (err) {
          reject(err);
        } else {
          resolve(token);
        }
      });
    });
  },
};