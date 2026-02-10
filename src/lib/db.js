import { MongoClient } from 'mongodb';
import './env.js'

const client = new MongoClient(process.env.MONGO_DB_URI);

let isConnected = false;
let db = null;

const connectDB = async () => {
    if (!isConnected) {
        try {
            await client.connect();
            isConnected = true;
            db = client.db('icloud');
            console.log('MongoDB connected to icloud database');

            client.on('error', (err) => {
                console.error('MongoDB client error:', err);
                isConnected = false;
            });

        } catch (error) {
            console.error('MongoDB connection failed:', error);
            process.exit(1);
        }
    }
    return db;
};

const database = await connectDB();
export default database;