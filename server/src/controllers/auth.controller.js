import User from "../models/user.model.js";
import jwt from "jsonwebtoken";
import { z } from "zod";
const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
const upperCaseRegex = /[A-Z]/;
const lowerCaseRegex = /[a-z]/;

/* =============================
   BASE VALIDATION SCHEMA
============================= */

const baseSchema = z.object({
    name: z.string().min(3).max(50),
    email: z.string().email().transform(v => v.toLowerCase()),
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
    isActive: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    companyName: z.string().optional()
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

    if (data.role === "faculty") {

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

    }

    try {

        const userExists = await User.findOne({ email: data.email });

        if (userExists) {
            return res.status(400).json({ message: "User already exists" });
        }

        const newUser = await User.create(data); // password hashed automatically

        const token = jwt.sign(
            { _id: newUser._id },
            process.env.JWT_SECRET,
            { expiresIn: "30d" }
        );

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


export { signup, login, logout };