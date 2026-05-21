import College from '../models/college.model.js';
import { z } from 'zod';

const createCollegeSchema = z.object({
    name: z.string().trim().min(2, 'College name is required'),

    slug: z
        .string()
        .trim()
        .toLowerCase()
        .min(2, 'Slug is required')
        .regex(
            /^[a-z0-9-]+$/,
            'Slug can only contain lowercase letters, numbers and hyphens'
        ),

    allowedDomains: z
        .array(
            z.string()
                .trim()
                .min(1, 'Domain cannot be empty')
                .regex(
                    /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
                    'Invalid domain format'
                )
        )
        .min(1, 'At least one allowed domain is required'),

    contactEmail: z
        .string()
        .email('Invalid email')
        .optional(),

    contactPhone: z
        .string()
        .trim()
        .optional()
});

const updateCollegeStatusSchema = z.object({
    isActive: z.boolean()
});


export const createCollege = async (req, res) => {
    try {
        // 1. Validate request
        const validatedData = createCollegeSchema.parse(req.body);

        // 2. Check duplicate
        const collegeExists = await College.findOne({
            slug: validatedData.slug
        });

        if (collegeExists) {
            return res.status(400).json({
                status: 'error',
                message: 'College slug already exists'
            });
        }

        // 3. Create
        const college = await College.create(validatedData);

        return res.status(201).json({
            status: 'success',
            data: college
        });

    } catch (error) {

        // Zod validation error
        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                errors: error.errors
            });
        }

        // Duplicate key from MongoDB
        if (error.code === 11000) {
            return res.status(400).json({
                status: 'error',
                message: 'College slug already exists'
            });
        }

        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};


export const getColleges = async (req, res) => {
    try {
        const colleges = await College.find();

        return res.status(200).json({
            status: 'success',
            data: colleges
        });

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};


export const updateCollegeStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const { isActive } = updateCollegeStatusSchema.parse(req.body);

        const college = await College.findByIdAndUpdate(
            id,
            { isActive },
            { new: true, runValidators: true }
        );

        if (!college) {
            return res.status(404).json({
                status: 'error',
                message: 'College not found'
            });
        }

        return res.status(200).json({
            status: 'success',
            data: college
        });

    } catch (error) {

        if (error.name === 'ZodError') {
            return res.status(400).json({
                status: 'error',
                errors: error.errors
            });
        }

        console.error(error);

        return res.status(500).json({
            status: 'error',
            message: 'Something went wrong'
        });
    }
};