// Authentication Service for 다녀와 App
import {
    signInWithPopup,
    GoogleAuthProvider,
    signOut as firebaseSignOut,
    onAuthStateChanged as firebaseOnAuthStateChanged,
    User
} from 'firebase/auth';
import { auth } from './firebaseConfig';

const googleProvider = new GoogleAuthProvider();

// Google 로그인
export async function signInWithGoogle(): Promise<User | null> {
    if (!auth) {
        console.error('Firebase auth is not initialized');
        throw new Error('Firebase가 초기화되지 않았습니다. 페이지를 새로고침해주세요.');
    }

    try {
        const result = await signInWithPopup(auth, googleProvider);
        console.log('Google login successful:', result.user.email);
        return result.user;
    } catch (error: any) {
        console.error('Google login failed:', error);

        // 사용자 친화적 에러 메시지
        if (error.code === 'auth/popup-closed-by-user') {
            throw new Error('로그인이 취소되었습니다.');
        } else if (error.code === 'auth/popup-blocked') {
            throw new Error('팝업이 차단되었습니다. 팝업 차단을 해제해주세요.');
        } else if (error.code === 'auth/unauthorized-domain') {
            throw new Error('이 도메인은 승인되지 않았습니다. Firebase Console에서 도메인을 추가해주세요.');
        }

        throw error;
    }
}

// 로그아웃
export async function signOut(): Promise<void> {
    if (!auth) {
        console.error('Firebase auth is not initialized');
        return;
    }

    try {
        await firebaseSignOut(auth);
        console.log('Signed out successfully');
    } catch (error) {
        console.error('Sign out failed:', error);
        throw error;
    }
}

// 인증 상태 변경 감지
export function onAuthStateChanged(callback: (user: User | null) => void): () => void {
    if (!auth) {
        console.error('Firebase auth is not initialized');
        return () => { };
    }
    return firebaseOnAuthStateChanged(auth, callback);
}

// 현재 사용자 가져오기
export function getCurrentUser(): User | null {
    if (!auth) return null;
    return auth.currentUser;
}

// Firebase User를 앱 UserProfile 형식으로 변환
export function firebaseUserToProfile(user: User) {
    return {
        id: user.uid,
        name: user.displayName || '사용자',
        email: user.email || '',
        photoUrl: user.photoURL || null
    };
}
