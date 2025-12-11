import type { VercelRequest, VercelResponse } from '@vercel/node';

// In-memory storage for demo/personal use
// For production, use Vercel KV, Supabase, or Firebase
let subscriptions: Map<string, {
  subscription: PushSubscription;
  schedules: any[];
  briefingSettings: any;
  children: any[];
  userId: string;
  updatedAt: string;
}> = new Map();

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'POST') {
    try {
      const { userId, subscription, schedules, briefingSettings, children } = req.body;

      if (!userId || !subscription) {
        return res.status(400).json({ error: 'userId and subscription are required' });
      }

      subscriptions.set(userId, {
        subscription,
        schedules: schedules || [],
        briefingSettings: briefingSettings || { enabled: false, time: "08:00", days: [1,2,3,4,5] },
        children: children || [],
        userId,
        updatedAt: new Date().toISOString()
      });

      console.log(`Subscription saved for user: ${userId}`);
      return res.status(200).json({ success: true, message: 'Subscription saved' });
    } catch (error) {
      console.error('Error saving subscription:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }
  }

  if (req.method === 'GET') {
    // Return all subscriptions (for cron job)
    const allSubs = Array.from(subscriptions.values());
    return res.status(200).json({ subscriptions: allSubs });
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      if (userId) {
        subscriptions.delete(userId);
        return res.status(200).json({ success: true, message: 'Subscription removed' });
      }
      return res.status(400).json({ error: 'userId is required' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove subscription' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
