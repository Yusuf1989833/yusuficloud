// app/admin/dashboard/page.jsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
    const [admin, setAdmin] = useState(null);
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem('adminToken');

        if (!token) {
            router.push('/icloudadmin/login');
            return;
        } else {
            router.push('/icloudadmin/panel');
        }

    }, [router]);


    if (!admin) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }
}