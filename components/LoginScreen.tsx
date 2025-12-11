
import React, { useState } from 'react';
import { CheckCircle2, ShieldCheck, Calendar } from 'lucide-react';

interface LoginScreenProps {
  onLogin: (user: any) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleLogin = () => {
    setIsLoading(true);
    setTimeout(() => {
      const mockUser = {
        id: 'google-user-123',
        name: '학부모님',
        email: 'parent@gmail.com',
        photoUrl: null 
      };
      onLogin(mockUser);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-white dark:from-gray-900 dark:to-gray-800 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-fade-in-up">
        
        {/* Header Section */}
        <div className="bg-indigo-600 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-lg mb-4 text-indigo-600">
               <Calendar className="w-8 h-8" strokeWidth={2.5} />
            </div>
            <h1 className="text-2xl font-bold text-white mb-1">다녀와</h1>
            <p className="text-indigo-200 text-sm">우리 아이 일정 관리의 시작</p>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-8 space-y-8">
          
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">AI 음성 알림</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">제미나이 AI가 아이 목소리로 일정을 알려줍니다.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">학원비 납부 관리</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">놓치기 쉬운 학원비 결제일을 챙겨드려요.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm">간편한 일정 공유</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">가족 구성원과 아이의 일정을 공유하세요.</p>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 dark:border-gray-700">
            <button
              onClick={handleGoogleLogin}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-white font-medium py-3.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group relative overflow-hidden"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-gray-300 border-t-indigo-600 rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26-1.19-.58z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  <span>Google 계정으로 시작하기</span>
                </>
              )}
            </button>
            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5 text-xs text-gray-400">
                   <ShieldCheck className="w-3 h-3" />
                   <span>안전한 보안 로그인</span>
                </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="bg-gray-50 dark:bg-gray-750 p-4 text-center border-t border-gray-100 dark:border-gray-700">
           <p className="text-xs text-gray-400">© 2024 다녀와. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};
