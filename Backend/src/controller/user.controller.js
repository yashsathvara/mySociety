const User = require("../models/user.schema");
const otpGnerator = require("otp-generator");
const twilio = require("twilio");
const crypto = require("crypto");
const senData = require("../config/mail");
const { hash } = require("../utils/hashpassword");
const { compare } = require("../utils/compare");
const { generateToeken } = require("../utils/GenerateToken");
const bcrypt = require("bcryptjs");
const OTP_EXPIRATION_TIME = 30 * 1000; // 30 seconds in milliseconds
const cloudinary = require("../utils/cloudinary");
const fs = require("fs");
const Guard = require("../models/SecurityGuard.model");
const { ForgotFormat } = require("../utils/resetpasswordui");
const Tenante = require("../models/Tenent.model");
const Owner = require("../models/Owener.model");

exports.signup = async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      Email,
      Phone,
      Country,
      State,
      City,
      select_society,
      password,
      Cpassword,
      role,
    } = req.body;

    // Check required fields
    if (
      !FirstName ||
      !LastName ||
      !Email ||
      !Phone ||
      !Country ||
      !State ||
      !City ||
      !select_society ||
      !password ||
      !Cpassword
    ) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    // Password length validation
    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters",
      });
    }

    // Confirm password length validation
    if (Cpassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Confirm password must be at least 6 characters",
      });
    }

    // Check if email exists
    const existingUserByEmail = await User.findOne({ Email });
    if (existingUserByEmail) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Confirm passwords match
    if (password !== Cpassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    // Hash the password
    const hashpassword = await hash(password);


    const user = await User.create({
      FirstName,
      LastName,
      Email,
      Phone,
      Country,
      State,
      City,
      select_society,
      password: hashpassword,
      role: role || "admin",
    });

    // Respond if user creation is successful
    if (user) {
      res.status(200).json({
        success: true,
        message: "User Registration Completed...",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};
exports.login = async (req, res) => {
  try {
    const { EmailOrPhone, password } = req.body;

    if (!EmailOrPhone || !password) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and password are required",
      });
    }

    let query = {};
    if (EmailOrPhone.includes("@")) {
      query = {
        $or: [
          { Email: EmailOrPhone },
          { MailOrPhone: EmailOrPhone },
          { Email_address: EmailOrPhone },
        ],
      };
    } else {
      query = {
        $or: [
          { Phone: EmailOrPhone },
          { MailOrPhone: EmailOrPhone },
          { Phone_number: EmailOrPhone },
        ],
      };
    }

    // Search for the account across all models
    const account =
      (await Owner.findOne(query)) ||
      (await Tenante.findOne(query)) ||
      (await User.findOne(query)) ||
      (await Guard.findOne(query));

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Invalid  credentials",
      });
    }

    const isPasswordValid = await bcrypt.compare(password, account.password);



    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid  credentials",
      });
    }

    // Generate JWT token
    generateToeken(account._id, res);

    // Send success response
    return res.status(200).json({
      success: true,
      message: "logged in successfully",
      user: { ...account._doc, password: "" },
    });
  } catch (error) {


    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.logout = async (req, res) => {
  try {
    res.clearCookie("society-auth", {
      path: "/",
      httpOnly: true,
      sameSite: "Strict",
      secure: process.env.NODE_ENV !== "development",
    });

    return res
      .status(200)
      .json({ success: true, message: "Logged out successfully" });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.SendOtp = async (req, res) => {
  try {
    const { EmailOrPhone } = req.body;

    if (!EmailOrPhone) {
      return res.status(400).json({
        success: false,
        message: "Please, enter an email or mobile number!",
      });
    }

    const otp = otpGnerator.generate(6, {
      upperCaseAlphabets: false,
      lowerCaseAlphabets: false,
      specialChars: false,
    });
    const currentTime = new Date();

    let account = await User.findOne({
      $or: [{ Email: EmailOrPhone }, { Phone: EmailOrPhone }],
    });
    if (!account) {
      account = await Guard.findOne({
        $or: [{ MailOrPhone: EmailOrPhone }, { MailOrPhone: EmailOrPhone }],
      });
    }
    if (!account) {
      account = await Owner.findOne({
        $or: [{ Email_address: EmailOrPhone }, { Phone_number: EmailOrPhone }],
      });
    }
    if (!account) {
      account = await Tenante.findOne({
        $or: [{ Email_address: EmailOrPhone }, { Phone_number: EmailOrPhone }],
      });
    }

    if (!account) {
      return res.status(404).json({
        success: false,
        message: "Email or phone number is not registered",
      });
    }

    if (account.otpExpiration && account.otpExpiration > currentTime) {
      return res.status(400).json({
        success: false,
        message: "Current OTP is still valid. Please wait for it to expire.",
      });
    }

    const formatPhoneNumber = (phone) => {
      if (!phone.startsWith('+')) {

        return `+91${phone}`;
      }
      return phone;
    };

    const otpExpiration = new Date(currentTime.getTime() + OTP_EXPIRATION_TIME);
    account.otp = otp;
    account.otpExpiration = otpExpiration;
    await account.save();

    if (EmailOrPhone.includes("@")) {
      // Send OTP via email
      await senData(
        account.Email || account.MailOrPhone || account.Email_address,
        "foget your password",
        ForgotFormat(account.Email, otp)
      );

      return res.status(200).json({
        success: true,
        message: "OTP sent successfully to email",
      });
    }
    
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.verifyOtp = async (req, res) => {
  try {
    const { EmailOrPhone, otp } = req.body;


    if (!EmailOrPhone || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email/Phone and OTP are required",
      });
    }

    let account;
    if (EmailOrPhone.includes("@")) {
      account =
        (await User.findOne({ Email: EmailOrPhone })) ||
        (await Guard.findOne({ MailOrPhone: EmailOrPhone })) ||
        (await Owner.findOne({ Email_address: EmailOrPhone })) ||
        (await Tenante.findOne({ Email_address: EmailOrPhone }));
    } else {
      account =
        (await User.findOne({ Phone: EmailOrPhone })) ||
        (await Guard.findOne({ MailOrPhone: EmailOrPhone })) ||
        (await Owner.findOne({ Phone_number: EmailOrPhone })) ||
        (await Tenante.findOne({ Phone_number: EmailOrPhone }));
    }


    if (!account) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (account.otp != otp) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully",
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
exports.ResetPassword = async (req, res) => {
  try {
    const { EmailOrPhone, new_pass, confirm_pass } = req.body;

    console.log("Reset Password Request:", req.body);

    // Validate password length
    if (new_pass.length < 6 || confirm_pass.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Validate matching passwords
    if (new_pass !== confirm_pass) {
      return res.status(400).json({
        success: false,
        message: "Password and confirm password do not match",
      });
    }

    // Find user by Email or Phone
    const account =
      (await User.findOne({
        $or: [{ Email: EmailOrPhone }, { Phone: EmailOrPhone }],
      })) ||
      (await Guard.findOne({
        $or: [{ MailOrPhone: EmailOrPhone }, { MailOrPhone: EmailOrPhone }],
      })) ||
      (await Owner.findOne({
        $or: [{ Email_address: EmailOrPhone }, { Phone_number: EmailOrPhone }],
      })) ||
      (await Tenante.findOne({
        $or: [{ Email_address: EmailOrPhone }, { Phone_number: EmailOrPhone }],
      }));

    if (!account) {
      console.log("No account found for:", EmailOrPhone);
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Hash new password
    const hashedPassword = await hash(new_pass);

    // Update password and save
    account.password = hashedPassword;
    await account.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error during password reset:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

exports.UpdateProfile = async (req, res) => {
  try {
    const {
      FirstName,
      LastName,
      Email,
      Phone,
      Country,
      State,
      City,
      select_society,
    } = req.body;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(Email)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email",
      });
    }

    let imageUrl;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "user_profiles",
        use_filename: true,
        unique_filename: false,
      });
      imageUrl = result.secure_url;

      // delete image from local after upload
      fs.unlink(req.file.path, (err) => {
        if (err) {
          console.log("error a deleting file", err);
        } else {
          console.log("file  deleted from server");
        }
      });
    }
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        FirstName,
        LastName,
        Email,
        Phone,
        Country,
        State,
        City,
        select_society,

        profileImage: imageUrl,
      },
      { new: true }
    );

    if (user) {
      res.status(200).json({
        success: true,
        message: "User  Profile Updated...",
        user: { ...user._doc, password: "" },
      });
    }
  } catch (error) {

    res.status(500).json({
      success: false,
      message: "Internal Server error",
    });
  }
};
exports.FindByIdProfile = async (req, res) => {
  try {
    const find = await User.findById(req.params.id, {
      otp: 0,
      otpExpiration: 0,
    });
    if (!find) {
      return res.status(400).json({
        success: false,
        message: "No Data Found",
      });
    }
    return res.status(200).json({
      success: true,
      Profile: find,
    });
  } catch (error) {

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
