const User = require("../models/User");
const bcrypt = require('bcryptjs');
const { sendMail } = require("../utils/Emails");
const { generateOTP } = require("../utils/GenerateOtp");
const Otp = require("../models/OTP");
const PasswordResetToken = require("../models/PasswordResetToken");
const { sanitizeUser } = require("../utils/SanitizeUser");
const { generateToken } = require("../utils/GenerateToken");

class AuthService {
    static instance;

    constructor() {
        if (AuthService.instance) {
            return AuthService.instance;
        }
        AuthService.instance = this;
    }

    async signup(req, res) {
        try {
            const existingUser = await User.findOne({ email: req.body.email });
            if (existingUser) {
                return res.status(400).json({ "message": "User already exists" });
            }
            
            const hashedPassword = await bcrypt.hash(req.body.password, 10);
            req.body.password = hashedPassword;

            const createdUser = new User({
                ...req.body,
                isAdmin: req.body.isAdmin || false // Default to false if not provided
            });
            await createdUser.save();

            // Send OTP after user creation
            const otpCode = generateOTP();
            const hashedOtp = await bcrypt.hash(otpCode, 10);
            
            const otpEntry = new Otp({
                user: createdUser._id,
                otp: hashedOtp,
                expiresAt: Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME)
            });
            
            await otpEntry.save();

            // Send OTP via email
            await sendMail(createdUser.email, 'Your OTP Code', `Your OTP code is: ${otpCode}`);

            res.status(201).json(sanitizeUser(createdUser));
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "User Created" });
        }
    }

    async login(req, res) {
        try {
            const existingUser = await User.findOne({ email: req.body.email });
            
            if (!existingUser || !(await bcrypt.compare(req.body.password, existingUser.password))) {
                return res.status(401).json({ message: "Invalid credentials" });
            }

            if (!existingUser.isVerified) {
                return res.status(403).json({ message: "Email not verified" });
            }

            const token = generateToken(sanitizeUser(existingUser));
            
            res.cookie('token', token, { httpOnly: true });
            
            return res.status(200).json(sanitizeUser(existingUser));
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: 'Some error occurred while logging in, please try again later' });
        }
    }

    async verifyOtp(req, res) {
        try {
            const isValidUserId = await User.findById(req.body.userId);
            
            if (!isValidUserId) {
                return res.status(404).json({ message: 'User not found' });
            }

            const isOtpExisting = await Otp.findOne({ user: isValidUserId._id });

            if (!isOtpExisting || isOtpExisting.expiresAt < new Date()) {
                return res.status(400).json({ message: "OTP has expired or does not exist" });
            }

            if (await bcrypt.compare(req.body.otp, isOtpExisting.otp)) {
                await Otp.findByIdAndDelete(isOtpExisting._id);
                const verifiedUser = await User.findByIdAndUpdate(isValidUserId._id, { isVerified: true }, { new: true });
                return res.status(200).json(sanitizeUser(verifiedUser));
            }

            return res.status(400).json({ message: 'Invalid OTP' });
        } catch (error) {
            console.log(error);
            res.status(500).json({ message: "Some error occurred" });
        }
    }

    async resendOtp(req, res) {
        try {
            const existingUser = await User.findById(req.body.user);

            if (!existingUser) {
                return res.status(404).json({ "message": "User not found" });
            }

            await Otp.deleteMany({ user: existingUser._id });

            const otpCode = generateOTP();
            const hashedOtp = await bcrypt.hash(otpCode, 10);

            const newOtpEntry = new Otp({
                user: existingUser._id,
                otp: hashedOtp,
                expiresAt: Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME)
            });

            await newOtpEntry.save();
            
            // Send OTP via email
            await sendMail(existingUser.email, 'Your OTP Code', `Your OTP code is: ${otpCode}`);
            
            res.status(201).json({ 'message': "OTP sent" });
        } catch (error) {
           console.log(error);
           res.status(500).json({ 'message': "Some error occurred while resending OTP" });
        }
    }

    async forgotPassword(req, res) {
        try {
           const isExistingUser = await User.findOne({ email: req.body.email });

           if (!isExistingUser) {
               return res.status(404).json({ message: "Provided email does not exist" });
           }

           await PasswordResetToken.deleteMany({ user: isExistingUser._id });

           const passwordResetToken = generateToken(sanitizeUser(isExistingUser), true);
           const hashedToken = await bcrypt.hash(passwordResetToken, 10);

           const newToken = new PasswordResetToken({
               user: isExistingUser._id,
               token: hashedToken,
               expiresAt: Date.now() + parseInt(process.env.OTP_EXPIRATION_TIME)
           });

           await newToken.save();

           // Send password reset link via email
           await sendMail(isExistingUser.email,
               'Password Reset Link',
               `<p>Dear ${isExistingUser.name},</p>
               <p>Click <a href=${"http://localhost:3000/reset-password/" + passwordResetToken}>here</a> to reset your password.</p>`
           );

           res.status(200).json({ message: `Password reset link sent to ${isExistingUser.email}` });
       } catch (error) {
           console.log(error);
           res.status(500).json({ message: 'Error occurred while sending password reset mail' });
       }
    }

    async resetPassword(req, res) {
       try {
           const isExistingUser = await User.findById(req.body.userId);

           if (!isExistingUser) {
               return res.status(404).json({ message: "User does not exist" });
           }

           const isResetTokenExisting = await PasswordResetToken.findOne({ user: isExistingUser._id });

           if (!isResetTokenExisting || isResetTokenExisting.expiresAt < new Date()) {
               return res.status(404).json({ message: "Reset link has expired or is invalid" });
           }

           if (await bcrypt.compare(req.body.token, isResetTokenExisting.token)) {
               // Update user's password
               await User.findByIdAndUpdate(isExistingUser._id, { password: await bcrypt.hash(req.body.password, 10) });

               // Delete the reset token after use
               await PasswordResetToken.findByIdAndDelete(isResetTokenExisting._id);

               return res.status(200).json({ message: "Password updated successfully" });
           }

           return res.status(404).json({ message: "Invalid reset link" });
       } catch (error) {
           console.log(error);
           res.status(500).json({ message: "Error occurred while resetting the password" });
       }
    }

    async logout(req, res) {
       try {
           // Clear cookie on logout
           res.cookie('token', '', { maxAge: 0 }); 
           return res.status(200).json({ message:'Logout successful' });
       } catch (error) {
           console.log(error);
       }
    }

    async checkAuth(req, res) {
       try {
           if (req.user) {
               const userDetails = await User.findById(req.user._id);
               return res.status(200).json(sanitizeUser(userDetails));
           }
           
           return res.sendStatus(401); // Unauthorized
       } catch (error) {
           console.log(error);
           return res.sendStatus(500); // Internal Server Error
       }
    }
}

// Exporting a singleton instance of AuthService
module.exports = new AuthService();