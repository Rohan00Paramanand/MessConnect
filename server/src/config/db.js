import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/messconnect';

    await mongoose.connect(mongoURI, {
      maxPoolSize: 200,
      minPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✓ MongoDB connected successfully with optimized pool (maxPoolSize: 200)');

    // Automatically drop obsolete indexes if they still exist in the database
    try {
      const collegesCollection = mongoose.connection.collection('colleges');
      const indexes = await collegesCollection.indexes();
      if (indexes.some(idx => idx.name === 'slug_1')) {
        await collegesCollection.dropIndex('slug_1');
        console.log('✓ Dropped obsolete slug_1 index from colleges collection');
      }
    } catch (indexError) {
      // Ignore if collection doesn't exist yet or index is already absent
    }
  } catch (error) {
    console.error('✗ MongoDB connection failed:', error.message);
    process.exit(1);
  }
};

export default connectDB;