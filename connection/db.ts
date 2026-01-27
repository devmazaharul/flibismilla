export {};
import { DATABASE_URL } from '@/app/api/controller/constant';
import mongoose from 'mongoose';

const MONGODB_URI = DATABASE_URL;

if (!MONGODB_URI) {
    throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}


interface MongooseConnection {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
}

declare global {
    // eslint-disable-next-line no-var
    var _mongoose: MongooseConnection | undefined;
}

const cached: MongooseConnection = global._mongoose || { conn: null, promise: null };

if (!global._mongoose) {
    global._mongoose = cached;
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
            maxPoolSize: 10, // Production optimization
        };

        cached.promise = mongoose
            .connect(MONGODB_URI!, opts)
            .then((mongoose) => {
                console.log('✅ Connected to MongoDB');
                return mongoose;
            })
            .catch((err) => {
                console.error('❌ MongoDB Connection Error:', err);
                throw err;
            });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
