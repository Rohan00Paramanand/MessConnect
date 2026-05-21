import User from "../models/user.model.js";
import Otp from "../models/otp.model.js";
import College from "../models/college.model.js";
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
    role: z.enum(["student", "vendor", "mess_committee", "college_admin", "super_admin"]),
    phoneNumber: z.string().min(10),

    collegeSlug: z.string().optional(),
    messAssigned: z.string().optional(), // ObjectId of the Mess
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





    if (data.role === "vendor") {
        if (!data.companyName) {
            return res.status(400).json({
                message: "Vendor must provide companyName"
            });
        }
        if (!data.messAssigned) {
            return res.status(400).json({
                message: "Vendor must select an assigned mess"
            });
        }
    }

    try {
        let collegeId = null;

        if (data.role !== "super_admin") {
            const emailDomain = data.email.split("@")[1];
            
            // For vendors and college_admins, we rely on the collegeSlug from the URL
            if (data.role === "vendor" || data.role === "college_admin") {
                if (!data.collegeSlug) {
                    return res.status(400).json({ message: "collegeSlug is required for vendors and admins" });
                }
                const college = await College.findOne({ slug: data.collegeSlug });
                if (!college) {
                    return res.status(400).json({ message: "Invalid college slug provided." });
                }
                collegeId = college._id;
            } 
            // For students and mess_committee, we STRICTLY enforce the email domain check
            else {
                const college = await College.findOne({ allowedDomains: emailDomain });
                
                if (!college) {
                    return res.status(400).json({ message: `Your email domain (${emailDomain}) is not registered with any college.` });
                }
                
                // If they happen to be on a college-specific URL, optionally verify it matches their email
                if (data.collegeSlug && college.slug !== data.collegeSlug) {
                     return res.status(400).json({ message: "Your email domain does not belong to this specific college portal." });
                }
                
                collegeId = college._id;
            }
        }

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
        // Also attach the dynamically resolved collegeId
        const userData = { ...data, isVerified: true };
        if (collegeId) {
            userData.collegeId = collegeId;
        }

        const newUser = await User.create(userData);

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
    console.log("Request object: ", req.body);
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

/* =============================
   RESET PASSWORD
============================= */

const resetPasswordSchema = z.object({
    email: z.email().transform(v => v.toLowerCase()),
    otp: z.string().length(6, { message: "OTP must be exactly 6 digits." }),
    newPassword: z.string()
        .min(8, { message: "Must be 8 char long." })
        .max(50)
        .regex(specialCharRegex, { message: "Must contain one special char." })
        .regex(upperCaseRegex, { message: "Must contain one upper case char." })
        .regex(lowerCaseRegex, { message: "Must contain one lower case char." })
});

const resetPassword = async (req, res) => {
    try {
        const parsedData = resetPasswordSchema.safeParse(req.body);
        
        if (!parsedData.success) {
            return res.status(400).json({
                message: "Invalid input format",
                error: parsedData.error.issues
            });
        }

        const { email, otp, newPassword } = parsedData.data;

        // Verify OTP
        const otpRecord = await Otp.findOne({ email, otp });
        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired OTP" });
        }

        // Verify User
        const user = await User.findOne({ email }).select("+password");
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Update password and let pre('save') hook hash it
        user.password = newPassword;
        await user.save();

        // Cleanup OTP
        await Otp.deleteOne({ _id: otpRecord._id });

        res.status(200).json({ status: "success", message: "Password reset successfully" });
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

export { signup, login, logout, sendOtp, resetPassword };