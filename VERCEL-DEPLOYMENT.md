Vercel 배포 가이드

1) 레포 연결
- Vercel 계정으로 로그인 후 "Import Project" -> GitHub에서 레포 선택

2) 환경변수 설정 (Project Settings > Environment Variables)
- Key: `VAPID_PUBLIC_KEY` Value: (from `npm run gen-vapid` output)
- Key: `VAPID_PRIVATE_KEY` Value: (from `npm run gen-vapid` output)
- Key: `VAPID_SUBJECT` Value: e.g. `mailto:you@example.com`

3) 빌드 & 배포
- Vercel은 `/api` 폴더에 있는 파일들을 Serverless Functions로 자동 배포합니다.
- 빌드 커맨드는 기본 `npm run build` 사용

4) 테스트
- 프론트에서 `syncSubscriptionWithServer()`로 구독을 서버에 저장
- Vercel 배포된 `api/send-notification`에 POST로 푸시 전송 테스트

추가 팁
- Vercel 환경변수는 `Production`으로 설정하세요.
- 로컬에서 개발할 때는 `.env` 파일에 `VITE_VAPID_PUBLIC_KEY`를 넣고 `npm run dev` 실행
