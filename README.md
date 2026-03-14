# 소방서 QR 출석관리 시스템

날짜·교육별 출석 세션 생성, QR코드 자동 생성, 실시간 출석 현황 및 부서별 통계를 제공하는 웹 앱입니다.

- **관리자**: [admin.html](admin.html) — 세션 생성, QR 표시, 출석 현황·차트
- **출석**: QR 스캔 시 attend.html로 이동 후 이름·부서 입력
- **테스트**: [scanner.html](scanner.html) — QR 스캐너 (카메라로 QR 인식 후 링크 이동)

## 기술

- HTML / CSS / JavaScript
- [qrcode.js](https://github.com/davidshimjs/qrcodejs), [Chart.js](https://www.chartjs.org/)
- 데이터: 브라우저 localStorage

## GitHub Pages 배포

1. 이 저장소를 GitHub에 푸시한 뒤 **Settings → Pages** 로 이동
2. **Source**: Deploy from a branch
3. **Branch**: `main` (또는 사용 중인 기본 브랜치), 폴더 `/ (root)` 선택 후 Save
4. 배포 후 접속 URL: `https://<사용자명>.github.io/<저장소명>/`

예: 저장소 이름이 `qr-attendance`이면  
`https://<사용자명>.github.io/qr-attendance/` 에서 관리자 페이지로 이동합니다.
