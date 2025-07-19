# 가계부 관리 시스템

간단하고 직관적인 가계부 관리 웹 애플리케이션입니다.

## 주요 기능

- 💰 **수입/지출 관리**: 일일 거래내역을 쉽게 기록하고 관리
- 📊 **대시보드**: 월별 수입/지출 통계와 잔액 확인
- 🏷️ **카테고리 관리**: 수입/지출 카테고리를 커스터마이징
- 📈 **통계 분석**: 차트를 통한 시각적 분석
- 📱 **반응형 디자인**: 모바일과 데스크톱에서 모두 사용 가능

## 기술 스택

### Backend
- **Node.js** - 서버 런타임
- **Express.js** - 웹 프레임워크
- **SQLite** - 데이터베이스
- **RESTful API** - 백엔드 API

### Frontend
- **HTML5/CSS3** - 마크업 및 스타일링
- **JavaScript (ES6+)** - 클라이언트 사이드 로직
- **Bootstrap 5** - UI 프레임워크
- **Chart.js** - 데이터 시각화
- **Font Awesome** - 아이콘

## 설치 및 실행

### 1. 의존성 설치
```bash
npm install
```

### 2. 서버 실행
```bash
# 개발 모드 (nodemon 사용)
npm run dev

# 프로덕션 모드
npm start
```

### 3. 브라우저에서 접속
```
http://localhost:3000
```

## 프로젝트 구조

```
budget_management/
├── config/
│   └── database.js          # 데이터베이스 설정
├── controller/
│   ├── categoryController.js # 카테고리 컨트롤러
│   └── transactionController.js # 거래내역 컨트롤러
├── model/
│   ├── Category.js          # 카테고리 모델
│   └── Transaction.js       # 거래내역 모델
├── routes/
│   └── api.js              # API 라우트
├── view/
│   ├── index.html          # 메인 페이지
│   └── js/
│       └── app.js          # 프론트엔드 로직
├── data/                   # SQLite 데이터베이스 파일
├── server.js               # 서버 진입점
└── package.json            # 프로젝트 설정
```

## API 엔드포인트

### 카테고리 API
- `GET /api/categories` - 모든 카테고리 조회
- `GET /api/categories/:type` - 타입별 카테고리 조회
- `POST /api/categories` - 카테고리 추가
- `PUT /api/categories/:id` - 카테고리 수정
- `DELETE /api/categories/:id` - 카테고리 삭제

### 거래내역 API
- `GET /api/transactions` - 모든 거래내역 조회
- `GET /api/transactions/:year/:month` - 월별 거래내역 조회
- `POST /api/transactions` - 거래내역 추가
- `PUT /api/transactions/:id` - 거래내역 수정
- `DELETE /api/transactions/:id` - 거래내역 삭제

### 통계 API
- `GET /api/stats/:year/:month` - 월별 통계 조회
- `GET /api/stats/:year/:month/categories` - 카테고리별 통계 조회

## 데이터베이스 스키마

### categories 테이블
- `id` (INTEGER PRIMARY KEY)
- `name` (TEXT NOT NULL)
- `type` (TEXT NOT NULL) - 'income' 또는 'expense'
- `color` (TEXT DEFAULT '#007bff')
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

### transactions 테이블
- `id` (INTEGER PRIMARY KEY)
- `amount` (DECIMAL(10,2) NOT NULL)
- `description` (TEXT)
- `category_id` (INTEGER) - categories 테이블 외래키
- `type` (TEXT NOT NULL) - 'income' 또는 'expense'
- `date` (DATE NOT NULL)
- `created_at` (DATETIME DEFAULT CURRENT_TIMESTAMP)

## 기본 카테고리

### 수입 카테고리
- 급여
- 용돈

### 지출 카테고리
- 식비
- 교통비
- 쇼핑
- 문화생활
- 의료비
- 기타

## 사용법

1. **거래 추가**: 우측 상단의 "거래 추가" 버튼을 클릭하여 새로운 수입/지출을 기록
2. **거래내역 확인**: 사이드바의 "거래내역" 메뉴에서 월별 거래내역을 확인
3. **카테고리 관리**: "카테고리" 메뉴에서 카테고리를 추가/삭제
4. **통계 확인**: "통계" 메뉴에서 차트를 통한 분석 결과 확인

## 개발 환경 설정

### 필요한 도구
- Node.js (v14 이상)
- npm 또는 yarn

### 개발 서버 실행
```bash
npm run dev
```

### 프로덕션 빌드
```bash
npm start
```

## 라이선스

MIT License

## 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문의사항

프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요. 