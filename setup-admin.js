import { MongoClient } from 'mongodb';
import './src/lib/env.js';

const MONGO_URI = process.env.MONGO_DB_URI;

async function setupAdmin() {
    const client = new MongoClient(MONGO_URI);
    
    try {
        await client.connect();
        console.log('Connected to MongoDB');
        
        const db = client.db('icloud');
        const adminsCollection = db.collection('admins');
        
        // Check if admin already exists
        const existingAdmin = await adminsCollection.findOne({ username: 'admin' });
        
        if (existingAdmin) {
            console.log('Admin user already exists!');
            console.log('Username: admin');
            console.log('Password: (check your database)');
        } else {
            // Create default admin user
            const defaultAdmin = {
                username: 'admin',
                password: 'admin123',
                createdAt: new Date()
            };
            
            await adminsCollection.insertOne(defaultAdmin);
            console.log('✅ Admin user created successfully!');
            console.log('-----------------------------------');
            console.log('Username: admin');
            console.log('Password: admin123');
            console.log('-----------------------------------');
            console.log('⚠️  Please change these credentials in production!');
        }
        
    } catch (error) {
        console.error('Error setting up admin:', error);
    } finally {
        await client.close();
    }
}

setupAdmin();
