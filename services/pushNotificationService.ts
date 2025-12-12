// Push Notification Service for 다녀와 App
// Handles push notification subscription and sync with server

// Read public VAPID key from build-time env variable (Vite exposes VITE_* vars)
const VAPID_PUBLIC_KEY = (import.meta && (import.meta as any).env && (import.meta as any).env.VITE_VAPID_PUBLIC_KEY) || 'BBHhsyia5-Nvf4Q5xf6aFni856xk3wbC4-72NMH-l97SsFHQ9ZqBEDQvlPAlvsdDOgqlIhR66vXu3Yysop0qcOs';

// Get the API base URL
function getApiBaseUrl(): string {
    // Use relative URL in production (same domain)
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return '';
}

// Convert VAPID key to Uint8Array
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
        .replace(/-/g, '+')
        .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray.buffer as ArrayBuffer;
}

// Check if push notifications are supported
export function isPushSupported(): boolean {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

// Get current notification permission status
export function getNotificationPermission(): NotificationPermission {
    return Notification.permission;
}

// Request notification permission
export async function requestNotificationPermission(): Promise<NotificationPermission> {
    if (!isPushSupported()) {
        console.warn('Push notifications are not supported');
        return 'denied';
    }

    const permission = await Notification.requestPermission();
    return permission;
}

// Subscribe to push notifications
export async function subscribeToPush(): Promise<PushSubscription | null> {
    try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:subscribeToPush',message:'Starting push subscription',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        
        const registration = await navigator.serviceWorker.ready;
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:subscribeToPush',message:'Service Worker ready',data:{scope:registration.scope,active:registration.active?.state},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        // Check for existing subscription
        let subscription = await registration.pushManager.getSubscription();
        
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:subscribeToPush',message:'Checked existing subscription',data:{hasSubscription:!!subscription},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion

        if (!subscription) {
            // Create new subscription
            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
            });
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:subscribeToPush',message:'New push subscription created',data:{endpoint:subscription.endpoint.substring(0,50)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.log('New push subscription created');
        } else {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:subscribeToPush',message:'Using existing push subscription',data:{endpoint:subscription.endpoint.substring(0,50)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
            // #endregion
            console.log('Using existing push subscription');
        }

        return subscription;
    } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:subscribeToPush',message:'Failed to subscribe to push',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        // #endregion
        console.error('Failed to subscribe to push:', error);
        return null;
    }
}

// Unsubscribe from push notifications
export async function unsubscribeFromPush(): Promise<boolean> {
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            await subscription.unsubscribe();
            console.log('Unsubscribed from push notifications');
            return true;
        }
        return false;
    } catch (error) {
        console.error('Failed to unsubscribe:', error);
        return false;
    }
}

// Sync subscription data with server
export async function syncSubscriptionWithServer(
    userId: string,
    schedules: any[],
    briefingSettings: any,
    children: any[]
): Promise<boolean> {
    try {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:syncSubscriptionWithServer',message:'Starting sync with server',data:{userId,scheduleCount:schedules.length},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        const subscription = await subscribeToPush();

        if (!subscription) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:syncSubscriptionWithServer',message:'No subscription available to sync',data:{},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            console.warn('No subscription available to sync');
            return false;
        }

        const baseUrl = getApiBaseUrl();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:syncSubscriptionWithServer',message:'Sending subscription to server',data:{baseUrl,endpoint:subscription.endpoint.substring(0,50)+'...'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        
        const response = await fetch(`${baseUrl}/api/subscribe`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                userId,
                subscription: subscription.toJSON(),
                schedules,
                briefingSettings,
                children
            })
        });

        if (!response.ok) {
            // #region agent log
            fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:syncSubscriptionWithServer',message:'Server responded with error',data:{status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
            // #endregion
            throw new Error(`Server responded with ${response.status}`);
        }

        const result = await response.json();
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:syncSubscriptionWithServer',message:'Subscription synced successfully',data:{result},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.log('Subscription synced with server:', result);
        return true;
    } catch (error: any) {
        // #region agent log
        fetch('http://127.0.0.1:7242/ingest/d3246301-7d65-4efc-ae7c-8b9ee7f0f794',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'pushNotificationService.ts:syncSubscriptionWithServer',message:'Failed to sync subscription',data:{error:error.message,stack:error.stack},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
        // #endregion
        console.error('Failed to sync subscription with server:', error);
        return false;
    }
}

// Remove subscription from server
export async function removeSubscriptionFromServer(userId: string): Promise<boolean> {
    try {
        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/subscribe`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ userId })
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to remove subscription from server:', error);
        return false;
    }
}

// Send a test notification
export async function sendTestNotification(): Promise<boolean> {
    try {
        const subscription = await subscribeToPush();

        if (!subscription) {
            console.warn('No subscription available');
            return false;
        }

        const baseUrl = getApiBaseUrl();
        const response = await fetch(`${baseUrl}/api/send-notification`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                subscription: subscription.toJSON(),
                title: '🔔 테스트 알림',
                body: '알림이 정상적으로 작동합니다!',
                data: { type: 'test' }
            })
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to send test notification:', error);
        return false;
    }
}
