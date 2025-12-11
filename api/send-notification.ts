import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

// VAPID keys - in production, use environment variables
const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || 'BNvdaekEHp7odyA0P2fPqnE5horZHLylL77UYKVdlMYnXeRMKL';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:danyowa@example.com';

if (VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { subscription, title, body, icon, data } = req.body;

        if (!subscription) {
            return res.status(400).json({ error: 'subscription is required' });
        }

        if (!VAPID_PRIVATE_KEY) {
            return res.status(500).json({ error: 'VAPID keys not configured' });
        }

        const payload = JSON.stringify({
            title: title || '다녀와 알림',
            body: body || '새로운 알림이 있습니다',
            icon: icon || 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
            badge: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
            data: data || {}
        });

        await webpush.sendNotification(subscription, payload);

        return res.status(200).json({ success: true, message: 'Notification sent' });
    } catch (error: any) {
        console.error('Error sending notification:', error);
        return res.status(500).json({
            error: 'Failed to send notification',
            details: error.message
        });
    }
}
