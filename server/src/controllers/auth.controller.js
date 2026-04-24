import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
import { sendEmail } from "../utils/sendEmail.js";
const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
const upperCaseRegex = /[A-Z]/;
const lowerCaseRegex = /[a-z]/;

/* =============================
   BASE VALIDATION SCHEMA
============================= */

const baseSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.email().transform(v => v.toLowerCase()),
    password: z.string()
        .min(8, { message: "Must be 8 char long." })
        .max(50)
        .regex(specialCharRegex, { message: "Must contain one special char." })
        .regex(upperCaseRegex, { message: "Must contain one upper case char." })
        .regex(lowerCaseRegex, { message: "Must contain one lower case char." }),
    role: z.enum(["student", "faculty", "vendor", "mess_committee"]),
    phoneNumber: z.string().min(10),

    department: z.string().optional(),
    branch: z.string().optional(),
    year: z.number().optional(),
    messType: z.enum(["card", "per-meal"]).optional(),
    messAssigned: z.enum(["Adhik boys mess", "Samruddhi Girls mess", "New girls mess", "None"]).optional(),
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    companyName: z.string().optional(),
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits." })
});


/* =============================
   SIGNUP CONTROLLER
============================= */

const signup = async (req, res) => {

    const parsedData = baseSchema.safeParse(req.body);

    if (!parsedData.success) {
        return res.status(400).json({
            message: "Invalid input format",
            error: parsedData.error
        });
    }

    const data = parsedData.data;

    /* =============================
       ROLE BASED VALIDATION
    ============================= */

    if (data.role === "student") {

        if (!data.department || !data.branch || !data.year || !data.messType) {
            return res.status(400).json({
                message: "Student must provide department, branch, year and messType"
            });
        }

    }

    if (data.role === "mess_committee") {

        if (!data.department || !data.branch) {
            return res.status(400).json({
                message: "Faculty must provide department and branch"
            });
        }

    }

    if (data.role === "vendor") {

        if (!data.companyName) {
            return res.status(400).json({
                message: "Vendor must provide companyName"
            });
        }
        if (!data.messAssigned || data.messAssigned === "None") {
            return res.status(400).json({
                message: "Vendor must select an assigned mess"
            });
        }

    }

    try {

        // Validate OTP
        const otpRecord = await Otp.findOne({
            $or: [
                { email: data.email },
                { phoneNumber: data.phoneNumber }
            ],
            otp: data.otp
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        const userExists = await User.findOne({ email: data.email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Create the user and set them as verified (if OTP succeeded, we can assume verified)
        const newUser = await User.create({ ...data, isVerified: true }); 
        
        // Cleanup OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        console.log("Before token creation.")
        const token = jwt.sign(
            { _id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        console.log("After token creation.")
        res.cookie("token", token, {
            httpOnly: true,
            sameSite: true
        });

        res.status(201).json({
            message: "User registered successfully",
            user: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



/* =============================
   LOGIN CONTROLLER
============================= */

const login = async (req, res) => {

    try {

        let { email, password } = req.body;

        if (email) email = email.toLowerCase();

        const user = await User.findOne({ email }).select("+password");

        if (!user) {
            return res.status(400).json({
                message: "Invalid email"
            });
        }

        const isMatch = await user.comparePassword(password);

        if (!isMatch) {
            return res.status(400).json({
                message: "Invalid password"
            });
        }

        if (["vendor", "mess_committee"].includes(user.role) && !user.isApprovedByAdmin) {
            return res.status(403).json({
                message: "Your account is pending admin verification."
            });
        }

        const token = jwt.sign(
            { _id: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

        res.cookie("token", token, {
            httpOnly: true,
            sameSite: true
        });

        res.status(200).json({
            message: "Logged in successfully",
            user: {
                name: user.name,
                email: user.email,
                role: user.role
            }
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



/* =============================
   LOGOUT
============================= */

const logout = (req, res) => {
    res.clearCookie("token", {
        httpOnly: true,
        sameSite: true
    });

    res.status(200).json({ message: "Logged out successfully" });
};


/* =============================
   SEND OTP
============================= */

const sendOtp = async (req, res) => {
    try {
        const { email, phoneNumber } = req.body;
        
        if (!email && !phoneNumber) {
            return res.status(400).json({ message: "Email or Phone Number is required" });
        }

        // Generate 6 digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await Otp.create({
            email: email ? email.toLowerCase() : undefined,
            phoneNumber,
            otp
        });

        // Send OTP
        if (email) {
            await sendEmail({
                email,
                subject: 'MessConnect Verification OTP',
                message: `Your verification OTP is: ${otp}. It is valid for 5 minutes.`
            });
        }
        
        if (phoneNumber) {
            console.log(`\n[SMS MOCK] Sending OTP ${otp} to phone ${phoneNumber}\n`);
        }

        res.status(200).json({ status: "success", message: "OTP sent successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getMe = async (req, res) => {
    try {
        res.json({ status: 'success', user: req.user });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

export { signup, login, logout, sendOtp };