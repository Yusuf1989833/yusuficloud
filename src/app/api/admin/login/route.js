import jwt from 'jsonwebtoken';
import database from '@/lib/db';

export async function POST(request) {
    try {
        const { username, password } = await request.json();
        if (!username || !password) {
            return Response.json(
                { error: 'Username and password required' },
                { status: 400 }
            );
        }

        const user = await database.collection('admins').findOne({
            username: username,
            password: password
        });

        if (!user) {
            return Response.json(
                { error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        const token = jwt.sign(
            {
                username: user.username,
                createdAt: new Date().toISOString()
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
            }
        );

        return Response.json({
            token: token
        });

    } catch (error) {
        console.error('Login error:', error);
        return Response.json(
            { error: 'Login failed: ' + error.message },
            { status: 500 }
        );
    }
}