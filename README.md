# 🎵 HapticBeat - Music-to-Haptic Conversion App

음악의 비트와 리듬을 분석하여 햅틱(진동) 피드백으로 변환하는 모바일 애플리케이션입니다.

## 📋 프로젝트 개요

HapticBeat은 사용자가 업로드한 음악 파일을 분석하여 리듬과 강도에 맞는 햅틱 패턴을 생성합니다. 음악을 재생하면 분석된 햅틱 데이터를 기반으로 기기가 비트에 맞춰 진동하여 새로운 음악 감상 경험을 제공합니다.

## ✨ 주요 기능

- **음악 파일 업로드**: MP3, WAV, M4A, FLAC, OGG 등 다양한 포맷 지원
- **자동 음악 분석**: librosa를 사용한 고급 오디오 분석
  - 비트(박자) 검출
  - RMS 에너지 분석
  - Onset Strength 계산
  - 스펙트럴 센트로이드 분석
- **햅틱 패턴 생성**: 시간, 강도, 지속시간이 포함된 정밀한 햅틱 데이터 생성
- **동기화된 재생**: 음악과 햅틱 피드백의 완벽한 동기화
- **아름다운 UI**: 현대적이고 직관적인 다크 테마 인터페이스

## 🛠️ 기술 스택

### Backend
- **Python 3.10**
- **FastAPI**: 고성능 비동기 API 프레임워크
- **librosa**: 음악 및 오디오 분석 라이브러리
- **numpy**: 수치 연산
- **uvicorn**: ASGI 서버

### Frontend
- **React Native**: 크로스 플랫폼 모바일 앱 개발
- **Expo**: React Native 개발 도구
- **expo-av**: 오디오 재생
- **expo-haptics**: 햅틱 피드백
- **expo-document-picker**: 파일 선택

### DevOps
- **Docker**: 컨테이너화
- **Docker Compose**: 서비스 오케스트레이션

## 📁 프로젝트 구조

```
hapticbeat/
│
├── backend/
│   ├── main.py              # FastAPI 서버
│   ├── audio_processor.py   # 오디오 분석 로직
│   ├── requirements.txt     # Python 의존성
│   ├── Dockerfile           # 백엔드 Docker 이미지
│   └── .dockerignore
│
├── frontend/
│   ├── App.js               # 메인 앱 컴포넌트
│   ├── components/
│   │   └── AudioPlayer.js   # 오디오 플레이어 & 햅틱 동기화
│   ├── package.json         # Node.js 의존성
│   ├── app.json            # Expo 설정
│   ├── babel.config.js     # Babel 설정
│   └── .gitignore
│
├── docker-compose.yml       # Docker Compose 설정
└── README.md               # 프로젝트 문서
```

## 🚀 시작하기

### 사전 요구사항

- **Docker** & **Docker Compose** (백엔드용)
- **Node.js** (v16 이상) & **npm** (프론트엔드용)
- **Expo CLI**: `npm install -g expo-cli`
- **모바일 기기** 또는 **에뮬레이터** (Android/iOS)

### 백엔드 설정 및 실행

#### Docker 사용 (권장)

```bash
# 프로젝트 루트 디렉토리에서
docker-compose up --build

# 백그라운드 실행
docker-compose up -d

# 중지
docker-compose down
```

#### 로컬 실행 (개발용)

```bash
cd backend

# 가상 환경 생성 (선택사항)
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt

# 서버 실행
python main.py
# 또는
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

백엔드 서버는 `http://localhost:8000`에서 실행됩니다.

API 문서: `http://localhost:8000/docs`

### 프론트엔드 설정 및 실행

```bash
cd frontend

# 의존성 설치
npm install

# Expo 개발 서버 시작
npm start
# 또는
expo start
```

#### 모바일 기기에서 실행

1. **Android**: `a` 키를 누르거나 `npm run android`
2. **iOS**: `i` 키를 누르거나 `npm run ios` (macOS만 가능)
3. **실제 기기**: Expo Go 앱을 다운로드하고 QR 코드 스캔

#### API URL 설정

`frontend/App.js` 파일에서 백엔드 API URL을 환경에 맞게 수정하세요:

```javascript
// Android Emulator
const API_URL = 'http://10.0.2.2:8000';

// iOS Simulator
const API_URL = 'http://localhost:8000';

// 실제 기기 (같은 네트워크)
const API_URL = 'http://YOUR_COMPUTER_IP:8000';
```

## 📱 사용 방법

1. **앱 실행**: 모바일 기기에서 HapticBeat 앱을 엽니다.
2. **파일 선택**: "음악 파일 선택" 버튼을 탭하여 음악 파일을 선택합니다.
3. **자동 분석**: 선택한 파일이 자동으로 백엔드로 전송되어 분석됩니다.
4. **결과 확인**: 분석 결과(길이, BPM, 햅틱 이벤트 수)를 확인합니다.
5. **재생**: 재생 버튼(▶️)을 탭하여 음악을 재생하면 리듬에 맞춰 진동을 느낄 수 있습니다.
6. **조작**: 시크바를 드래그하여 특정 구간으로 이동하거나, 일시정지/정지 버튼을 사용합니다.

## 🔧 API 엔드포인트

### POST `/upload_music`

음악 파일을 업로드하고 햅틱 데이터를 생성합니다.

**요청**:
```
Content-Type: multipart/form-data
file: <audio_file>
```

**응답**:
```json
{
  "success": true,
  "haptic_data": [
    {
      "time": 1.25,
      "intensity": 0.8,
      "duration": 0.12
    },
    ...
  ],
  "metadata": {
    "duration": 180.5,
    "tempo_bpm": 128.0,
    "sample_rate": 22050,
    "total_events": 245,
    "beat_events": 150,
    "onset_events": 95
  },
  "message": "파일이 성공적으로 분석되었습니다."
}
```

### GET `/health`

서버 상태 확인

**응답**:
```json
{
  "status": "healthy"
}
```

## 🎨 햅틱 데이터 구조

각 햅틱 이벤트는 다음 형식으로 생성됩니다:

```json
{
  "time": 1.25,      // 이벤트 발생 시간 (초)
  "intensity": 0.8,  // 진동 강도 (0.0 ~ 1.0)
  "duration": 0.1    // 진동 지속시간 (초)
}
```

**강도 매핑**:
- `0.8 ~ 1.0`: Heavy (강한 진동)
- `0.5 ~ 0.8`: Medium (중간 진동)
- `0.2 ~ 0.5`: Light (약한 진동)

## 🧪 개발 및 테스트

### 백엔드 테스트

```bash
# API 헬스 체크
curl http://localhost:8000/health

# 파일 업로드 테스트
curl -X POST "http://localhost:8000/upload_music" \
  -H "accept: application/json" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/your/music.mp3"
```

### 프론트엔드 디버깅

Expo는 개발 중 다양한 디버깅 도구를 제공합니다:

- 개발 메뉴: 기기를 흔들거나 `Cmd+D` (iOS) / `Cmd+M` (Android)
- 원격 디버깅: Chrome DevTools 사용
- React DevTools: `npm install -g react-devtools`

## 🐳 Docker 명령어

```bash
# 빌드
docker-compose build

# 실행
docker-compose up

# 백그라운드 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f backend

# 중지
docker-compose down

# 볼륨까지 삭제
docker-compose down -v

# 컨테이너 재시작
docker-compose restart backend
```

## 📈 성능 최적화

### 백엔드
- librosa의 `sr` 파라미터를 조정하여 샘플링 레이트 최적화
- 큰 파일의 경우 청크 단위 처리
- 결과 캐싱 구현 (Redis 등)

### 프론트엔드
- 큰 햅틱 데이터 압축 전송
- 오프라인 재생을 위한 로컬 캐싱
- 백그라운드 재생 지원

## 🔒 보안 고려사항

- 파일 크기 제한 설정 (현재 기본값)
- 허용된 파일 형식만 업로드 가능
- CORS 설정 (프로덕션에서는 특정 도메인으로 제한)
- 업로드된 파일 자동 삭제
- Rate limiting 구현 권장

## 🛣️ 로드맵

- [ ] S3/클라우드 스토리지 통합
- [ ] 사용자 인증 및 프로필
- [ ] 햅틱 패턴 커스터마이징
- [ ] 소셜 기능 (패턴 공유)
- [ ] 실시간 햅틱 미리보기
- [ ] 더 많은 분석 알고리즘
- [ ] Apple Watch / Wearable 지원
- [ ] 백그라운드 재생

## 🤝 기여하기

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 🙏 감사의 글

- [librosa](https://librosa.org/) - 강력한 오디오 분석 라이브러리
- [FastAPI](https://fastapi.tiangolo.com/) - 현대적인 Python 웹 프레임워크
- [Expo](https://expo.dev/) - React Native 개발 플랫폼

## 📞 문의

문제가 발생하거나 질문이 있으시면 GitHub Issues를 통해 연락해주세요.

---

**HapticBeat** - 음악을 새로운 방식으로 경험하세요! 🎵📳

