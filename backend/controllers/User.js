const User = require("../models/User");
const bcrypt = require('bcryptjs');
const { sendMail } = require("../utils/Emails");
const { generateOTP } = require("../utils/GenerateOtp");
const Otp = require("../models/OTP");
const { sanitizeUser } = require("../utils/SanitizeUser");

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = (await User.findById(id)).toObject();
    delete result.password; // Remove password from response
    res.status(200).json(result);
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ message: "Error getting your details, please try again later" });
  }
};

exports.updateById = async (req, res) => {
    try {
        const { id } = req.params;
        const updatedUser = await User.findByIdAndUpdate(id, req.body, { new: true }).select('-password'); // Exclude password
        res.status(200).json(updatedUser);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Error updating your details, please try again later' });
    }
};