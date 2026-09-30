import MealPass from '../models/mealPass.model.js';
import MealAttendance from '../models/mealAttendance.model.js';
import User from '../models/user.model.js';

/**
 * Determine current meal session based on hour of the day
 */
const getCurrentMealType = () => {
  const currentHour = new Date().getHours();
  if (currentHour >= 7 && currentHour < 11) return 'Breakfast';
  if (currentHour >= 12 && currentHour < 16) return 'Lunch';
  if (currentHour >= 16 && currentHour < 19) return 'Snacks';
  if (currentHour >= 19 && currentHour < 23) return 'Dinner';
  return 'General';
};

/**
 * GET /api/meals/my-pass
 * Retrieves the logged-in student's meal pass and recent attendance logs
 */
export const getMyMealPass = async (req, res) => {
  try {
    const studentId = req.user._id;

    // Find or automatically initialize a pass with 0 meals for new students
    let pass = await MealPass.findOne({ student: studentId });
    if (!pass) {
      pass = await MealPass.create({
        student: studentId,
        collegeId: req.user.collegeId,
        messAssigned: req.user.messAssigned,
        remainingMeals: 0,
        totalMealsPurchased: 0
      });
    }

    const recentAttendance = await MealAttendance.find({ student: studentId })
      .sort({ createdAt: -1 })
      .limit(7)
      .populate('mess', 'name')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: {
        pass: {
          remainingMeals: pass.remainingMeals,
          totalMealsPurchased: pass.totalMealsPurchased,
          isFaceRegistered: Boolean(pass.faceDescriptor && pass.faceDescriptor.length > 0),
          facePhoto: pass.facePhoto || null,
          faceRegisteredAt: pass.faceRegisteredAt || null,
          updatedAt: pass.updatedAt
        },
        recentAttendance
      }
    });
  } catch (error) {
    console.error('Error fetching student meal pass:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve meal pass details'
    });
  }
};

/**
 * POST /api/meals/purchase
 * Dummy meal purchase - credits meals without real payment gateway
 */
export const purchaseMeals = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { mealCount, planTitle, dummyAmount } = req.body;

    const parsedCount = parseInt(mealCount, 10);
    if (isNaN(parsedCount) || parsedCount <= 0) {
      return res.status(400).json({
        status: 'error',
        message: 'Please provide a valid meal count greater than zero'
      });
    }

    // Atomically increment remaining and total purchased meals
    const pass = await MealPass.findOneAndUpdate(
      { student: studentId },
      {
        $inc: {
          remainingMeals: parsedCount,
          totalMealsPurchased: parsedCount
        },
        $setOnInsert: {
          collegeId: req.user.collegeId,
          messAssigned: req.user.messAssigned
        }
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: 'success',
      message: `Successfully credited ${parsedCount} meals to your pass!`,
      data: {
        remainingMeals: pass.remainingMeals,
        totalMealsPurchased: pass.totalMealsPurchased,
        planTitle: planTitle || `${parsedCount} Meal Package`,
        dummyAmount: dummyAmount || 0
      }
    });
  } catch (error) {
    console.error('Error processing dummy meal purchase:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to process meal purchase'
    });
  }
};

/**
 * POST /api/meals/register-face
 * Saves the student's 128-dimensional face embedding vector and snapshot
 */
export const registerFace = async (req, res) => {
  try {
    const studentId = req.user._id;
    const { faceDescriptor, facePhoto } = req.body;

    if (!Array.isArray(faceDescriptor) || faceDescriptor.length !== 128) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid biometric face descriptor. Expected a 128-element numerical vector.'
      });
    }

    const pass = await MealPass.findOneAndUpdate(
      { student: studentId },
      {
        $set: {
          faceDescriptor,
          facePhoto: facePhoto || '',
          faceRegisteredAt: new Date()
        },
        $setOnInsert: {
          collegeId: req.user.collegeId,
          messAssigned: req.user.messAssigned,
          remainingMeals: 0
        }
      },
      { new: true, upsert: true }
    );

    return res.status(200).json({
      status: 'success',
      message: 'Biometric face registration completed successfully!',
      data: {
        isFaceRegistered: true,
        faceRegisteredAt: pass.faceRegisteredAt
      }
    });
  } catch (error) {
    console.error('Error registering student face descriptor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to save biometric face registration'
    });
  }
};

/**
 * GET /api/meals/vendor/enrolled-students
 * Allows vendor's scanner to fetch enrolled face descriptors for instant offline/client-side matching
 */
export const getEnrolledStudentsForMess = async (req, res) => {
  try {
    const vendorMessId = req.user.messAssigned;
    const vendorCollegeId = req.user.collegeId;

    // Filter students belonging to this mess or college who have a registered face
    const query = {
      'faceDescriptor.0': { $exists: true }
    };

    if (vendorCollegeId) {
      query.collegeId = vendorCollegeId;
    }

    if (vendorMessId) {
      query.$or = [
        { messAssigned: vendorMessId },
        { messAssigned: null },
        { messAssigned: { $exists: false } }
      ];
    }

    const passes = await MealPass.find(query)
      .populate('student', 'name email phoneNumber')
      .lean();

    const enrolledStudents = passes
      .filter((p) => p.student != null)
      .map((p) => ({
        studentId: p.student._id,
        name: p.student.name,
        email: p.student.email,
        phoneNumber: p.student.phoneNumber,
        remainingMeals: p.remainingMeals,
        faceDescriptor: p.faceDescriptor,
        facePhoto: p.facePhoto
      }));

    return res.status(200).json({
      status: 'success',
      count: enrolledStudents.length,
      data: enrolledStudents
    });
  } catch (error) {
    console.error('Error fetching enrolled students for vendor:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to load enrolled student biometrics'
    });
  }
};

/**
 * POST /api/meals/scan-attendance
 * Vendor scanner records student attendance after face recognition match
 */
export const markMealAttendance = async (req, res) => {
  try {
    const vendor = req.user;
    const { studentId, customMealType } = req.body;

    if (!studentId) {
      return res.status(400).json({
        status: 'error',
        message: 'Student ID is required'
      });
    }

    const studentUser = await User.findById(studentId);
    if (!studentUser) {
      return res.status(404).json({
        status: 'error',
        message: 'Student account not found'
      });
    }

    // Step 1: Check if student currently has any remaining meals
    const existingPass = await MealPass.findOne({ student: studentId });
    if (!existingPass || existingPass.remainingMeals <= 0) {
      return res.status(400).json({
        status: 'error',
        code: 'MEALS_DEPLETED',
        studentName: studentUser.name,
        remainingMeals: 0,
        message: `${studentUser.name} has 0 remaining meals left! Please ask the student to recharge their meal pass.`
      });
    }

    const mealType = customMealType || getCurrentMealType();

    // Step 2: Prevent multiple check-ins within the same meal session today
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    const sessionQuery = {
      student: studentId,
      createdAt: { $gte: startOfToday, $lte: endOfToday }
    };

    if (mealType !== 'General') {
      sessionQuery.mealType = mealType;
    } else {
      // If outside predefined meal slots (General), apply a 2-hour session cooldown
      sessionQuery.createdAt = { $gte: new Date(Date.now() - 2 * 60 * 60 * 1000) };
    }

    const recentCheckIn = await MealAttendance.findOne(sessionQuery);

    if (recentCheckIn) {
      const sessionName = mealType !== 'General' ? `today's ${mealType}` : 'this session';
      return res.status(409).json({
        status: 'warning',
        code: 'RECENTLY_CHECKED_IN',
        studentName: studentUser.name,
        remainingMeals: existingPass.remainingMeals,
        message: `${studentUser.name} has already checked in for ${sessionName}! Next check-in is allowed in the next meal session.`
      });
    }

    // Step 3: Atomically decrement 1 meal
    const updatedPass = await MealPass.findOneAndUpdate(
      { student: studentId, remainingMeals: { $gt: 0 } },
      { $inc: { remainingMeals: -1 } },
      { new: true }
    );

    if (!updatedPass) {
      return res.status(400).json({
        status: 'error',
        code: 'MEALS_DEPLETED',
        studentName: studentUser.name,
        remainingMeals: 0,
        message: 'No meals left to deduct.'
      });
    }

    // Step 4: Record attendance log
    const attendanceRecord = await MealAttendance.create({
      student: studentId,
      vendor: vendor._id,
      mess: vendor.messAssigned || studentUser.messAssigned,
      collegeId: vendor.collegeId,
      mealType,
      remainingMealsAfter: updatedPass.remainingMeals,
      verificationMethod: 'face_biometric'
    });

    return res.status(200).json({
      status: 'success',
      message: `Meal marked for ${studentUser.name}! (${updatedPass.remainingMeals} meals left)`,
      data: {
        studentId: studentUser._id,
        studentName: studentUser.name,
        mealType,
        remainingMeals: updatedPass.remainingMeals,
        timestamp: attendanceRecord.createdAt
      }
    });
  } catch (error) {
    console.error('Error marking meal attendance:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to record attendance'
    });
  }
};

/**
 * GET /api/meals/vendor/recent-attendance
 * Vendor's live feed of marked attendances today
 */
export const getVendorAttendanceHistory = async (req, res) => {
  try {
    const vendorMessId = req.user.messAssigned;
    const vendorCollegeId = req.user.collegeId;

    const query = { collegeId: vendorCollegeId };
    if (vendorMessId) {
      query.mess = vendorMessId;
    }

    const logs = await MealAttendance.find(query)
      .sort({ createdAt: -1 })
      .limit(30)
      .populate('student', 'name email phoneNumber')
      .lean();

    return res.status(200).json({
      status: 'success',
      data: logs
    });
  } catch (error) {
    console.error('Error fetching vendor attendance logs:', error);
    return res.status(500).json({
      status: 'error',
      message: 'Failed to retrieve attendance logs'
    });
  }
};
