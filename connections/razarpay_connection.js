const Razorpay = require("razorpay");

class RazorpayConnection {
  constructor() {
    this.configureRazorpay();
  }

  configureRazorpay() {
    this.razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  }

  getRazorpay() {
    return this.razorpay;
  }
}

module.exports = new RazorpayConnection();
