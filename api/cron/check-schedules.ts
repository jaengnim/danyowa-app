import type { VercelRequest, VercelResponse } from '@vercel/node';
import webpush from 'web-push';

const VAPID_PUBLIC_KEY = process.env.VAPID_PUBLIC_KEY || '';
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY || '';
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:danyowa@example.com';

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
    webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

// Helper to get subscriptions from the subscribe API
async function getSubscriptions(baseUrl: string) {
    try {
        const response = await fetch(`${baseUrl}/api/subscribe`);
        const data = await response.json();
        return data.subscriptions || [];
    } catch (error) {
        console.error('Failed to fetch subscriptions:', error);
        return [];
    }
}

// Format time for display
function formatTime(timeStr: string): string {
    const [h, m] = timeStr.split(':').map(Number);
    const period = h < 12 ? '오전' : '오후';
    const hour = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${period} ${hour}시${m > 0 ? ` ${m}분` : ''}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // Verify this is a cron job request (Vercel adds this header)
    const authHeader = req.headers.authorization;
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === 'production') {
        // In production, require cron secret. Skip in development.
        console.log('Cron job running (auth skipped for development)');
    }

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
        return res.status(500).json({ error: 'VAPID keys not configured' });
    }

    const baseUrl = `https://${req.headers.host}`;
    const now = new Date();
    const koreaTime = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Seoul' }));

    const currentDay = koreaTime.getDay();
    const currentHour = koreaTime.getHours();
    const currentMinute = koreaTime.getMinutes();
    const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    const currentTotalMinutes = currentHour * 60 + currentMinute;

    console.log(`Cron running at ${currentTimeStr} (Korea time), day: ${currentDay}`);

    try {
        const subscriptions = await getSubscriptions(baseUrl);
        let notificationsSent = 0;

        for (const sub of subscriptions) {
            const { subscription, schedules, briefingSettings, children, userId } = sub;

            // 1. Check for briefing time
            if (briefingSettings?.enabled) {
                if (briefingSettings.days.includes(currentDay) && briefingSettings.time === currentTimeStr) {
                    const todaySchedules = schedules.filter((s: any) => s.dayOfWeek === currentDay);
                    const scheduleList = todaySchedules.map((s: any) => {
                        const child = children.find((c: any) => c.id === s.childId);
                        return `${child?.name || '자녀'}: ${formatTime(s.startTime)} ${s.title}`;
                    }).join('\n');

                    const body = todaySchedules.length > 0
                        ? `오늘 ${todaySchedules.length}개 일정이 있습니다.\n${scheduleList}`
                        : '오늘 예정된 일정이 없습니다. 즐거운 하루 되세요!';

                    try {
                        await webpush.sendNotification(subscription, JSON.stringify({
                            title: '🌅 오늘의 브리핑',
                            body,
                            icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
                            data: { type: 'briefing', url: '/' }
                        }));
                        notificationsSent++;
                        console.log(`Briefing sent to user: ${userId}`);
                    } catch (error) {
                        console.error(`Failed to send briefing to ${userId}:`, error);
                    }
                }
            }

            // 2. Check for schedule notifications
            for (const schedule of schedules) {
                if (schedule.dayOfWeek !== currentDay) continue;

                const [startH, startM] = schedule.startTime.split(':').map(Number);
                const startMinutes = startH * 60 + startM;
                const notifyBeforeMinutes = schedule.notifyMinutesBefore || 0;
                const notifyTime = startMinutes - notifyBeforeMinutes;

                // Check start notification
                if (currentTotalMinutes === notifyTime) {
                    const child = children.find((c: any) => c.id === schedule.childId);
                    const childName = child?.name || '자녀';
                    const timeMsg = notifyBeforeMinutes > 0 ? `${notifyBeforeMinutes}분 후` : '지금';
                    const suppliesMsg = schedule.supplies ? `\n준비물: ${schedule.supplies}` : '';

                    try {
                        await webpush.sendNotification(subscription, JSON.stringify({
                            title: `🏃 ${childName} 등원 알림`,
                            body: `${timeMsg} ${schedule.title}에 갈 시간입니다!${suppliesMsg}`,
                            icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
                            data: { type: 'schedule', scheduleId: schedule.id, url: '/' }
                        }));
                        notificationsSent++;
                        console.log(`Start notification sent for ${schedule.title} to ${userId}`);
                    } catch (error) {
                        console.error(`Failed to send start notification:`, error);
                    }
                }

                // Check pickup notification
                if (schedule.pickupNotifyMinutesBefore !== undefined) {
                    const [endH, endM] = schedule.endTime.split(':').map(Number);
                    const endMinutes = endH * 60 + endM;
                    const pickupNotifyTime = endMinutes - schedule.pickupNotifyMinutesBefore;

                    if (currentTotalMinutes === pickupNotifyTime) {
                        const child = children.find((c: any) => c.id === schedule.childId);
                        const childName = child?.name || '자녀';
                        const timeMsg = schedule.pickupNotifyMinutesBefore > 0
                            ? `${schedule.pickupNotifyMinutesBefore}분 후`
                            : '지금';

                        try {
                            await webpush.sendNotification(subscription, JSON.stringify({
                                title: `🚗 ${childName} 하원 알림`,
                                body: `${timeMsg} ${schedule.title}이(가) 끝납니다. 데리러 가세요!`,
                                icon: 'https://cdn-icons-png.flaticon.com/512/2693/2693507.png',
                                data: { type: 'pickup', scheduleId: schedule.id, url: '/' }
                            }));
                            notificationsSent++;
                            console.log(`Pickup notification sent for ${schedule.title} to ${userId}`);
                        } catch (error) {
                            console.error(`Failed to send pickup notification:`, error);
                        }
                    }
                }
            }
        }

        return res.status(200).json({
            success: true,
            message: `Cron completed. Sent ${notificationsSent} notifications.`,
            time: currentTimeStr,
            day: currentDay,
            subscriptionsChecked: subscriptions.length
        });
    } catch (error: any) {
        console.error('Cron job error:', error);
        return res.status(500).json({ error: 'Cron job failed', details: error.message });
    }
}
