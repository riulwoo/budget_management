# 💰 가계부 관리 시스템

현대적이고 직관적인 개인 가계부 관리 웹 애플리케이션입니다.

## ✨ 주요 기능

### � 대시보드
- **실시간 재정 현황**: 총 잔액, 월별 수입/지출 한눈에 확인
- **빠른 거래 추가**: 원클릭으로 새로운 거래 기록
- **시각적 통계**: 직관적인 차트와 그래프

### 💳 거래 관리
- **상세 거래 내역**: 날짜별, 카테고리별 필터링
- **빠른 편집**: 인라인 편집으로 즉시 수정
- **검색 기능**: 키워드로 거래 내역 빠른 검색
- **계좌/카드 구분**: 결제 수단별 관리

### 🗂️ 카테고리 시스템
- **계층형 구조**: 메인 카테고리와 하위 카테고리
- **색상 커스터마이징**: 시각적 구분을 위한 색상 설정
- **사용 통계**: 카테고리별 사용량 분석

### 📅 캘린더 뷰
- **월별 달력**: 날짜별 거래 내역 시각화
- **일별 요약**: 각 날짜의 수입/지출 요약
- **오늘 날짜 자동 선택**: 편리한 네비게이션

### 📝 메모 시스템
- **개인 메모**: 개인용 메모 작성 및 관리
- **공개 메모**: 다른 사용자와 공유 가능한 메모
- **우선순위 설정**: 중요도별 메모 분류
- **완료 상태 관리**: 체크리스트 기능

### 📈 통계 및 분석
- **CSS 차트**: 경량화된 시각적 차트
- **카테고리별 분석**: 지출 패턴 분석
- **월별/연별 비교**: 시계열 분석
- **예산 대비 실적**: 목표 대비 성과 확인

### 💎 자산 관리 시스템
- **다양한 자산 유형**: 현금, 예금, 적금, 투자, 부동산 등
- **개별 자산 관리**: 각 자산의 이름, 금액, 설명 등록
- **자산 유형 커스터마이징**: 사용자 정의 자산 유형 추가
- **시각적 자산 현황**: 자산 유형별 색상과 아이콘 구분
- **총 자산 계산**: 모든 자산의 합계 자동 계산

### � 사용자 관리
- **회원가입/로그인**: 개인 계정 시스템
- **JWT 인증**: 보안 강화된 토큰 기반 인증
- **프로필 관리**: 사용자 정보 수정
### 📱 반응형 디자인
- **모바일 최적화**: 터치 친화적 인터페이스
- **데스크톱 지원**: PC에서 편리한 사용
- **다크모드 지원**: 시각적 편의성 향상
- **PWA 지원**: 앱처럼 사용 가능

## 🛠️ 기술 스택

### Backend
- **Node.js** - 서버 런타임 환경
- **Express.js** - 웹 애플리케이션 프레임워크
- **MariaDB/MySQL** - 관계형 데이터베이스
- **JWT** - JSON Web Token 인증
- **bcrypt** - 비밀번호 암호화
- **RESTful API** - 표준 API 설계

### Frontend
- **React 18** - 현대적 UI 라이브러리
- **React Router** - 클라이언트 사이드 라우팅
- **React Context** - 전역 상태 관리
- **Webpack** - 모듈 번들러
- **Babel** - JavaScript 트랜스파일러

## 🚀 설치 및 실행

### 📋 필수 요구사항
- **Node.js** v16.0.0 이상
- **MariaDB** 또는 **MySQL** 5.7 이상
- **npm** 또는 **yarn**

### 1. 저장소 클론
```bash
git clone https://github.com/riulwoo/budget_management.git
cd budget_management
```

### 2. 의존성 설치
```bash
npm install
```

### 3. 환경 설정
`.env` 파일을 생성하고 다음과 같이 설정:
```env
# 데이터베이스 설정
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=budget_management

# JWT 설정
JWT_SECRET=your_jwt_secret_key

# 서버 설정
PORT=3000
NODE_ENV=development
```

### 4. 데이터베이스 설정
```bash
# MariaDB/MySQL 접속
mysql -u root -p

# 데이터베이스 생성
CREATE DATABASE budget_management CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE budget_management;

# 스키마 생성
SOURCE database_schema.sql;
```

### 5. 프론트엔드 빌드
```bash
# 개발 모드 빌드
npm run build

# 또는 웹팩 직접 실행
npx webpack --mode development
```

### 6. 서버 실행
```bash
# 개발 모드
npm run dev

# 프로덕션 모드
npm start

# 또는 직접 실행
node server.js
```

### 7. 브라우저 접속
```
http://localhost:3000
```

## 📁 프로젝트 구조

```
budget_management/
├── 📁 config/
│   └── database.js              # MariaDB 연결 및 설정
├── 📁 controller/
│   ├── authController.js        # 사용자 인증 컨트롤러
│   ├── balanceController.js     # 잔액 관리 컨트롤러
│   ├── categoryController.js    # 카테고리 관리 컨트롤러
│   ├── memoController.js        # 메모 관리 컨트롤러
│   └── transactionController.js # 거래내역 컨트롤러
├── 📁 middleware/
│   └── auth.js                  # JWT 인증 미들웨어
├── 📁 model/
│   ├── Category.js              # 카테고리 모델
│   ├── InitialBalance.js        # 초기잔액 모델
│   ├── Memo.js                  # 메모 모델
│   ├── Transaction.js           # 거래내역 모델
│   └── User.js                  # 사용자 모델
├── 📁 routes/
│   └── api.js                   # API 라우트 정의
├── 📁 src/                      # React 프론트엔드
│   ├── index.js                 # 진입점
│   ├── App.js                   # 메인 컴포넌트
│   ├── 📁 components/
│   │   ├── Layout.js            # 레이아웃 컴포넌트
│   │   ├── Sidebar.js           # 사이드바 네비게이션
│   │   ├── CategoryChart.js     # 차트 컴포넌트
│   │   ├── CategoryManager.js   # 카테고리 관리
│   │   ├── RecentTransactions.js# 최근 거래내역
│   │   └── 📁 modals/
│   │       ├── CategoryModal.js     # 카테고리 모달
│   │       ├── LoginModal.js        # 로그인 모달
│   │       ├── ProfileModal.js      # 프로필 모달
│   │       ├── RegisterModal.js     # 회원가입 모달
│   │       └── TransactionModal.js  # 거래 모달
│   ├── 📁 context/
│   │   ├── AuthContext.js       # 인증 컨텍스트
│   │   └── DataContext.js       # 데이터 컨텍스트
│   ├── 📁 hooks/
│   │   └── useMediaQuery.js     # 반응형 훅
│   ├── 📁 pages/
│   │   ├── Dashboard.js         # 대시보드
│   │   ├── Transactions.js      # 거래내역 페이지
│   │   ├── Categories.js        # 카테고리 페이지
│   │   ├── Statistics.js        # 통계 페이지
│   │   ├── Calendar.js          # 캘린더 페이지
│   │   ├── Memos.js             # 메모 페이지
│   │   ├── Profile.js           # 프로필 페이지
│   │   └── AssetManager.js      # 자산 관리 페이지
│   ├── 📁 styles/
│   │   └── App.css              # 메인 스타일시트
│   └── 📁 utils/
│       └── api.js               # API 유틸리티
├── 📁 public/
│   ├── index.html               # HTML 템플릿
│   └── bundle.js                # 웹팩 번들 파일
├── 📁 data/
│   └── budget.db                # SQLite 백업 파일
├── database_schema.sql          # 데이터베이스 스키마
├── sample_data.sql              # 샘플 데이터
├── clean_database.sql           # 데이터베이스 정리 스크립트
├── webpack.config.js            # 웹팩 설정
├── server.js                    # Express 서버 진입점
└── package.json                 # 프로젝트 의존성
```

## 🎯 사용법

### 1. 회원가입 및 로그인
- 우측 상단 "로그인" 버튼으로 시작
- 새 계정 생성 또는 기존 계정으로 로그인

### 2. 초기 설정
- **잔액 설정**: 현재 보유 금액을 초기 잔액으로 설정
- **카테고리 커스터마이징**: 개인 맞춤 카테고리 추가

### 3. 거래 기록
- **대시보드**: "거래 추가" 버튼으로 빠른 입력
- **상세 정보**: 카테고리, 계좌/카드, 메모까지 상세 기록

### 4. 데이터 분석
- **캘린더 뷰**: 월별 캘린더에서 일별 수입/지출 확인
- **통계 페이지**: 카테고리별 지출 패턴 분석
- **차트 분석**: 시각적 데이터로 트렌드 파악

### 5. 메모 활용
- **개인 메모**: 개인적인 재정 계획 및 메모
- **공개 메모**: 다른 사용자와 팁 공유
- **우선순위**: 중요한 재정 목표 설정

## 🌟 주요 특징

### 🎨 현대적 UI/UX
- **그라데이션 디자인**: 모던한 색상 조합
- **애니메이션**: 부드러운 전환 효과
- **반응형**: 모든 디바이스에서 최적화

### ⚡ 성능 최적화
- **지연 로딩**: 필요한 데이터만 로드
- **캐싱**: 중복 API 호출 방지
- **번들 최적화**: 웹팩으로 최적화된 빌드

### 🔒 보안
- **JWT 토큰**: 안전한 인증 시스템
- **비밀번호 암호화**: bcrypt 해싱
- **SQL 인젝션 방지**: 파라미터화된 쿼리

## 🛣️ 로드맵

### 🎯 v2.0 계획
- [ ] **예산 관리**: 카테고리별 예산 설정 및 알림
- [ ] **목표 설정**: 저축 목표 및 진행률 추적
- [ ] **반복 거래**: 정기적인 수입/지출 자동 입력
- [ ] **데이터 내보내기**: CSV, Excel 형태로 데이터 출력

### 🔮 향후 개발
- [ ] **모바일 앱**: React Native 앱 개발
- [ ] **다중 통화**: 환율 계산 및 다중 통화 지원
- [ ] **가족 계정**: 가족 구성원과 가계부 공유
- [ ] **AI 추천**: 지출 패턴 분석 및 절약 팁 제공

## 📄 라이선스

이 프로젝트는 **MIT License** 하에 배포됩니다. 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 🤝 기여하기

프로젝트 개선에 참여해주세요!

### 📝 기여 방법
1. **Fork** 프로젝트를 포크합니다
2. **Branch** 기능 브랜치를 생성합니다 (`git checkout -b feature/AmazingFeature`)
3. **Commit** 변경사항을 커밋합니다 (`git commit -m 'Add some AmazingFeature'`)
4. **Push** 브랜치에 푸시합니다 (`git push origin feature/AmazingFeature`)
5. **Pull Request** 를 생성합니다

### 🐛 버그 리포트
- **이슈 템플릿** 을 사용해주세요
- **재현 방법** 을 상세히 설명해주세요
- **스크린샷** 을 첨부해주세요

### 💡 기능 제안
- **Use Case** 를 구체적으로 설명해주세요
- **목적과 필요성** 을 명확히 해주세요

## 👨‍💻 개발자

**riulwoo** - *Initial work* - [GitHub](https://github.com/riulwoo)

⭐ **이 프로젝트가 도움이 되었다면 스타를 눌러주세요!** 