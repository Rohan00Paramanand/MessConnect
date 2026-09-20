import connectDB from './src/config/db.js';
import User from './src/models/user.model.js';
import dotenv from 'dotenv';

dotenv.config();

const makeAdmin = async () => {
    try {
        await connectDB();

        const {
            SUPER_ADMIN_EMAIL,
            SUPER_ADMIN_PASSWORD,
            SUPER_ADMIN_NAME,
            SUPER_ADMIN_PHONE,
        } = process.env;

        if (
            !SUPER_ADMIN_EMAIL ||
            !SUPER_ADMIN_PASSWORD ||
            !SUPER_ADMIN_NAME ||
            !SUPER_ADMIN_PHONE
        ) {
            throw new Error(
                'Missing required Super Admin environment variables'
            );
        }

        const existing = await User.findOne({
            email: SUPER_ADMIN_EMAIL,
        });

        if (existing) {
            console.log('Super Admin already exists!');
            process.exit(0);
        }

        const newAdmin = new User({
            name: SUPER_ADMIN_NAME,
            email: SUPER_ADMIN_EMAIL,
            password: SUPER_ADMIN_PASSWORD,
            role: 'super_admin',
            phoneNumber: SUPER_ADMIN_PHONE,
            isApprovedByAdmin: true,
            isVerified: true,
        });

        await newAdmin.save();

        console.log(`Super Admin created successfully: ${SUPER_ADMIN_EMAIL}`);
        process.exit(0);
    } catch (err) {
        console.error('Failed to create Super Admin:', err);
        process.exit(1);
    }
};

makeAdmin();
