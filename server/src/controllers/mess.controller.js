import Mess from '../models/mess.model.js';
import { z } from 'zod';

const createMessSchema = z.object({
    name: z.string().min(1, 'Name is required').trim()
});

const updateMessSchema = z.object({
    name: z.string().min(1, 'Name is required').trim().optional(),
    isActive: z.boolean().optional()
});

/**
 * createMess — Create a new mess under the college_admin's college
 */
export const createMess = async (req, res) => {
    try {
        const validated = createMessSchema.parse(req.body);
        
        // Check duplicate name in same college
        const exists = await Mess.findOne({ name: validated.name, collegeId: req.collegeId });
        if (exists) {
            return res.status(400).json({ status: 'error', message: 'A mess with this name already exists in your college' });
        }

        const newMess = await Mess.create({
            name: validated.name,
            collegeId: req.collegeId
        });

        res.status(201).json({ status: 'success', data: newMess });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};

/**
 * getMesses — Read-only list of ACTIVE messes for logged-in users of this college
 */
export const getMesses = async (req, res) => {
    try {
        const messes = await Mess.find({ collegeId: req.collegeId, isActive: true }).sort('name');
        res.status(200).json({ status: 'success', data: messes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};

/**
 * getAdminMesses — List of ALL messes (active + inactive) for college admins to manage
 */
export const getAdminMesses = async (req, res) => {
    try {
        const messes = await Mess.find({ collegeId: req.collegeId }).sort('name');
        res.status(200).json({ status: 'success', data: messes });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};

/**
 * updateMess — Update mess name or toggle active status (deactivate instead of hard delete)
 */
export const updateMess = async (req, res) => {
    try {
        const { id } = req.params;
        const validated = updateMessSchema.parse(req.body);

        const mess = await Mess.findOne({ _id: id, collegeId: req.collegeId });
        if (!mess) {
            return res.status(404).json({ status: 'error', message: 'Mess not found or does not belong to your college' });
        }

        if (validated.name !== undefined) mess.name = validated.name;
        if (validated.isActive !== undefined) mess.isActive = validated.isActive;

        await mess.save();

        res.status(200).json({ status: 'success', data: mess });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message || 'Something went wrong' });
    }
};
