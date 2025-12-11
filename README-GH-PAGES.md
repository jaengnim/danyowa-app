배포 순서 (GitHub Pages + Vercel 백엔드)

1) VAPID 키 생성 (로컬)

```bash
npm ci
npm run gen-vapid
```

출력된 `VAPID_PUBLIC_KEY`와 `VAPID_PRIVATE_KEY`를 복사합니다.

2) GitHub 레포 설정 (프론트)
- Repository > Settings > Pages에서 `gh-pages` 브랜치를 배포 대상으로 설정하거나, 위 워크플로우는 자동으로 `gh-pages`로 배포합니다.
- Repository > Settings > Secrets and variables > Actions에 `VITE_VAPID_PUBLIC_KEY` 시크릿으로 `VAPID_PUBLIC_KEY` 값을 추가합니다.

3) 백엔드 배포 (푸시 전송 API)
- Vercel 사용 권장: 레포의 `api/` 폴더는 Vercel의 Serverless Functions로 자동 배포됩니다.
- Vercel 환경변수에 다음을 추가하세요:
  - `VAPID_PUBLIC_KEY`: public key
  - `VAPID_PRIVATE_KEY`: private key
  - `VAPID_SUBJECT`: e.g. `mailto:you@example.com`

4) 빌드 및 배포
- `main` 브랜치에 푸시하면 GitHub Actions가 빌드 후 `gh-pages`에 배포합니다.
- Vercel에 레포 연결 후 `api/`가 자동으로 배포됩니다.

5) 확인
- 앱에서 알림 권한 허용 후 구독을 생성합니다.
- 서버에 구독 저장 후 `sendTestNotification()`로 푸시 전송을 테스트합니다.

주의사항
- iOS 사파리는 푸시 지원이 제한적입니다(홈스크린 PWA에서 동작 조건이 존재).
- `VAPID_PRIVATE_KEY`는 절대 프론트에 노출하지 마세요.
