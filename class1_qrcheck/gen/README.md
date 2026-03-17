# 🔥 소방서 QR코드 출석관리 시스템

> Fire Station QR Attendance Management System

## 📋 프로젝트 개요

소방서 교육 출석을 QR코드 기반으로 관리하는 시스템입니다.  
교육 담당자는 관리페이지에서 세션을 생성하고 QR코드를 출력하며, 교육생은 QR코드를 스캔해 모바일로 출석을 등록합니다.

---

## 🗂 파일 구조

```
├── index.html      # 관리자 페이지 (교육 관리 + 세션 생성 + QR 발급)
├── qrcheck.html    # 출석 입력 페이지 (QR 스캔 후 이동)
└── README.md
```

---

## ✅ 구현된 기능

### 관리 페이지 (`index.html`)
| 구분 | 기능 |
|------|------|
| **교육 관리 공간 (좌측)** | 전체 세션 수 / 총 출석자 / 오늘 출석 실시간 통계 |
| | 교육 세션 목록 (세션별 출석자 수 표시) |
| | 세션 클릭 시 출석 현황 미리보기 (5명) |
| | 전체 출석 명단 모달 팝업 |
| | CSV 내보내기 |
| | 부서별 출석 통계 바 차트 (Chart.js) |
| | 세션 삭제 |
| **교육 생성 공간 (우측)** | 날짜 / 교육명 / 설명 입력 후 세션 생성 |
| | 세션 생성 즉시 고유 QR코드 자동 생성 |
| | QR코드 이미지 저장 / 인쇄 / 링크 복사 |
| | QR 크게 보기 모달 |
| | 기존 세션 QR 재발급 |
| **실시간** | Supabase Realtime으로 출석 즉시 반영 |
| **DB 설정** | Supabase URL / Anon Key 브라우저 저장 |

### 출석 페이지 (`qrcheck.html`)
| 기능 | 설명 |
|------|------|
| 세션 정보 표시 | URL 파라미터로 세션 자동 로드 |
| 이름 입력 | 텍스트 직접 입력 |
| 부서 선택 | 9개 빠른 선택 버튼 또는 직접 입력 |
| 중복 출석 차단 | 동일 이름 중복 등록 방지 |
| 출석 완료 화면 | 초록색 애니메이션 오버레이 |
| 오류 처리 | 잘못된 QR코드 / 네트워크 오류 안내 |
| 모바일 최적화 | 터치 친화적 UI, 진동 피드백 |

---

## 🗄 데이터 구조 (Supabase)

### `sessions` 테이블
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 자동 생성 |
| name | TEXT | 교육명 |
| date | DATE | 교육 날짜 |
| description | TEXT | 교육 설명 (선택) |
| created_at | TIMESTAMPTZ | 생성 시각 |

### `attendances` 테이블
| 필드 | 타입 | 설명 |
|------|------|------|
| id | UUID (PK) | 자동 생성 |
| session_id | UUID (FK) | sessions.id 참조 |
| name | TEXT | 출석자 이름 |
| department | TEXT | 소속 부서 |
| attended_at | TIMESTAMPTZ | 출석 등록 시각 |

---

## 🚀 시작 방법

### 1. Supabase 프로젝트 설정

1. [Supabase](https://supabase.com) 에서 새 프로젝트 생성
2. SQL Editor에서 아래 쿼리 실행:

```sql
-- sessions 테이블
CREATE TABLE sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- attendances 테이블
CREATE TABLE attendances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  department TEXT NOT NULL,
  attended_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS 정책 설정
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendances ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow_all_sessions" ON sessions
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "allow_all_attendances" ON attendances
  FOR ALL USING (true) WITH CHECK (true);
```

3. Supabase 대시보드 → Project Settings → API에서:
   - **Project URL** 복사
   - **anon public key** 복사

### 2. 시스템 접속

1. `index.html` 열기
2. 우측 상단 `⚙️ DB 설정` 버튼 클릭
3. Supabase URL과 Anon Key 입력 후 저장
4. 교육 세션 생성 → QR코드 자동 생성
5. QR코드 출력 후 교육장에 부착
6. 교육생이 QR코드 스캔 → 이름/부서 입력 → 출석 완료

---

## 🔗 페이지 URL

| 페이지 | 경로 | 설명 |
|--------|------|------|
| 관리 페이지 | `/index.html` | 세션 관리, QR 생성 |
| 출석 입력 | `/qrcheck.html?session={세션ID}` | QR 스캔 후 출석 입력 |

---

## 🎨 기술 스택

| 분류 | 기술 |
|------|------|
| 프론트엔드 | 순수 HTML5 / CSS3 / Vanilla JS |
| DB | Supabase (PostgreSQL) |
| 실시간 | Supabase Realtime (WebSocket) |
| QR 생성 | QRCode.js (CDN) |
| 차트 | Chart.js 4.x (CDN) |
| 아이콘 | Font Awesome 6 (CDN) |
| 폰트 | Google Fonts (Noto Sans KR) |
| 테마 | 소방 빨간색 (#D32F2F) 기반 |

---

## 🔮 추가 개발 권장사항

- [ ] 관리자 로그인 / 인증 기능
- [ ] 기간별 출석 통계 (주간/월간)
- [ ] 출석률 리포트 PDF 출력
- [ ] 교육생 사전 등록 기능
- [ ] 부서 커스터마이징 (관리자 설정)
- [ ] 출석 마감 시간 설정
- [ ] 다중 소방서 지원 (멀티 테넌트)
- [ ] 출석자 수정/삭제 기능
