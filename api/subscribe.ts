import type { VercelRequest, VercelResponse } from '@vercel/node';
import { kv } from '@vercel/kv';

// Key prefix for subscriptions
const SUBSCRIPTION_PREFIX = 'sub:';

interface SubscriptionData {
  subscription: any;
  schedules: any[];
  briefingSettings: any;
  children: any[];
  userId: string;
  updatedAt: string;
}

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

      const data: SubscriptionData = {
        subscription,
        schedules: schedules || [],
        briefingSettings: briefingSettings || { enabled: false, time: "08:00", days: [1, 2, 3, 4, 5] },
        children: children || [],
        userId,
        updatedAt: new Date().toISOString()
      };

      // Save to Vercel KV
      await kv.set(`${SUBSCRIPTION_PREFIX}${userId}`, data);

      // Also add to the list of all user IDs for easier retrieval
      await kv.sadd('subscription_users', userId);

      console.log(`Subscription saved for user: ${userId}`);
      return res.status(200).json({ success: true, message: 'Subscription saved' });
    } catch (error) {
      console.error('Error saving subscription:', error);
      return res.status(500).json({ error: 'Failed to save subscription' });
    }
  }

  if (req.method === 'GET') {
    try {
      // Get all user IDs from the set
      const userIds = await kv.smembers('subscription_users');

      if (!userIds || userIds.length === 0) {
        return res.status(200).json({ subscriptions: [] });
      }

      // Get all subscriptions
      const subscriptions: SubscriptionData[] = [];
      for (const userId of userIds) {
        const data = await kv.get<SubscriptionData>(`${SUBSCRIPTION_PREFIX}${userId}`);
        if (data) {
          subscriptions.push(data);
        }
      }

      return res.status(200).json({ subscriptions });
    } catch (error) {
      console.error('Error getting subscriptions:', error);
      return res.status(500).json({ error: 'Failed to get subscriptions' });
    }
  }

  if (req.method === 'DELETE') {
    try {
      const { userId } = req.body;
      if (userId) {
        await kv.del(`${SUBSCRIPTION_PREFIX}${userId}`);
        await kv.srem('subscription_users', userId);
        return res.status(200).json({ success: true, message: 'Subscription removed' });
      }
      return res.status(400).json({ error: 'userId is required' });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to remove subscription' });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}

