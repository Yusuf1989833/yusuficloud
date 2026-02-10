import jwt from 'jsonwebtoken';
import database from '../lib/db.js';
import { headers } from 'next/headers.js';

export const verifyToken = async (token) => {
    try {
        if (!token) {
            return { valid: false, error: 'No token' };
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded.username || !decoded.createdAt) {
            return { valid: false, error: 'Invalid token' };
        }
        const user = await database.collection('admins').findOne({
            username: decoded.username
        });

        if (!user) {
            return { valid: false, error: 'User not found' };
        }

        return {
            valid: true,
            username: decoded.username,
            createdAt: decoded.createdAt
        };

    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return { valid: false, error: 'Invalid token' };
        }
        if (error.name === 'TokenExpiredError') {
            return { valid: false, error: 'Token expired' };
        }
        return { valid: false, error: 'Token check failed' };
    }
};

export const withAuthRequest = (handler) => {
    return async (req, context) => {
        try {
            const headersList = await headers();
            const authHeader = headersList.get('authorization');
            const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

            if (!token) {
                return new Response(JSON.stringify({ error: 'No token' }), { status: 401 });
            }

            const verification = await verifyToken(token);

            if (!verification.valid) {
                return new Response(JSON.stringify({ error: verification.error }), { status: 401 });
            }

            return handler(req, context, {
                username: verification.username,
                valid: verification.valid,
                createdAt: verification.createdAt
            });

        } catch (error) {
            return new Response(JSON.stringify({ error: 'Auth failed' }), { status: 500 });
        }
    };
};