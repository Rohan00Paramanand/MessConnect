import connectDB from './src/config/db.js';
import User from './src/models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const makeAdmin = async () => {
    try {
        await connectDB();
        
        const email = 'admin@messconnect.com';
        const existing = await User.findOne({ email });
        
        if (existing) {
            console.log('Super Admin already exists!');
            process.exit(0);
        }
        
        // Bypassing controllers to directly seed MongoDB
        const newAdmin = new User({
            name: 'Super Admin',
            email,
            password: 'Password123!',
            role: 'super_admin',
            phoneNumber: '0000000000',
            isApprovedByAdmin: true,
            isVerified: true
        });

        await newAdmin.save();
        
        console.log(`\n========================================`);
        console.log(`✅ Super Admin created successfully!`);
        console.log(`Email: ${email}`);
        console.log(`Password: Password123!`);
        console.log(`========================================\n`);
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to seed admin:', err.message);
        process.exit(1);
    }
}
makeAdmin();
