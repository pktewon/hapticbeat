# 🚀 HapticBeat 설치 및 설정 가이드

## 빠른 시작 (Quick Start)

### 1단계: 저장소 클론

```bash
git clone https://github.com/yourusername/hapticbeat.git
cd hapticbeat
```

### 2단계: 백엔드 실행

**Docker 사용 (권장):**

```bash
docker-compose up -d
```

**또는 로컬 Python 환경:**

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py
```

백엔드가 `http://localhost:8000`에서 실행됩니다.

### 3단계: 프론트엔드 실행

```bash
cd frontend
npm install
npm start
```

### 4단계: 모바일 앱 실행

- Android 에뮬레이터: `a` 키 누르기
- iOS 시뮬레이터: `i` 키 누르기 (macOS만)
- 실제 기기: Expo Go 앱으로 QR 코드 스캔

## 상세 설정 가이드

### 백엔드 설정

#### 환경 변수 설정 (선택사항)

```bash
cd backend
cp .env.example .env
# .env 파일을 편집하여 필요한 설정을 변경
```

#### 시스템 요구사항 (로컬 실행 시)

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install libsndfile1 ffmpeg
```

**macOS:**
```bash
brew install libsndfile ffmpeg
```

**Windows:**
- FFmpeg를 [공식 사이트](https://ffmpeg.org/download.html)에서 다운로드하고 PATH에 추가

#### Docker 설정

`docker-compose.yml` 파일에서 포트를 변경하려면:

```yaml
services:
  backend:
    ports:
      - "8080:8000"  # 호스트:컨테이너
```

### 프론트엔드 설정

#### API URL 설정

`frontend/App.js` 파일의 5번째 줄 근처에서 API_URL을 수정:

```javascript
// 개발 환경에 맞게 선택
const API_URL = 'http://10.0.2.2:8000';      // Android Emulator
// const API_URL = 'http://localhost:8000';    // iOS Simulator
// const API_URL = 'http://192.168.1.100:8000'; // 실제 기기 (내 IP 주소로 변경)
```

**내 컴퓨터 IP 주소 찾기:**

- Windows: `ipconfig`
- macOS/Linux: `ifconfig` 또는 `ip addr`

#### Expo 계정 (선택사항)

빌드 및 배포를 위해 Expo 계정 생성:

```bash
expo register
expo login
```

### 네트워크 설정

#### 방화벽 설정

백엔드 서버(포트 8000)가 외부에서 접근 가능하도록 방화벽 설정:

**Windows:**
```powershell
netsh advfirewall firewall add rule name="HapticBeat Backend" dir=in action=allow protocol=TCP localport=8000
```

**Ubuntu/Linux:**
```bash
sudo ufw allow 8000/tcp
```

**macOS:**
시스템 환경설정 > 보안 및 개인정보 보호 > 방화벽 > 방화벽 옵션

## 문제 해결

### 백엔드 문제

#### 1. librosa 설치 실패

**오류:** "ERROR: Failed building wheel for librosa"

**해결:**
```bash
# 필수 패키지 설치
pip install numpy==1.24.3
pip install numba
pip install librosa
```

#### 2. FFmpeg 관련 오류

**오류:** "NoBackendError: Cannot load audio"

**해결:**
- FFmpeg가 설치되어 있는지 확인: `ffmpeg -version`
- 설치되지 않았다면 위의 시스템 요구사항 섹션 참조

#### 3. Docker 빌드 느림

**해결:**
```bash
# 빌드 캐시 사용
docker-compose build --parallel

# 멀티 스테이지 빌드는 이미 Dockerfile에 적용됨
```

### 프론트엔드 문제

#### 1. 백엔드 연결 실패

**오류:** "Network request failed"

**해결 방법:**
1. 백엔드가 실행 중인지 확인: `curl http://localhost:8000/health`
2. API_URL이 올바른지 확인
3. 방화벽 설정 확인
4. Android 에뮬레이터는 `10.0.2.2` 사용
5. iOS 시뮬레이터는 `localhost` 사용
6. 실제 기기는 컴퓨터의 로컬 IP 사용

#### 2. 모듈을 찾을 수 없음

**오류:** "Unable to resolve module"

**해결:**
```bash
# node_modules 삭제 후 재설치
rm -rf node_modules
npm install

# 캐시 클리어
expo start -c
```

#### 3. 햅틱이 작동하지 않음

**확인 사항:**
- 실제 기기에서 테스트 (에뮬레이터는 햅틱 미지원)
- 기기의 진동 설정 확인
- Android: 시스템 설정 > 소리 및 진동
- iOS: 설정 > 소리 및 햅틱

#### 4. 파일 선택 실패

**오류:** "Document picker failed"

**해결:**
```bash
# 패키지 재설치
expo install expo-document-picker
```

**권한 확인:**
- Android: 스토리지 권한 허용
- iOS: 파일 앱 접근 권한 허용

### 성능 문제

#### 1. 음악 분석이 너무 느림

**해결 방법:**
- 백엔드 리소스 증가 (Docker memory limit 조정)
- 샘플링 레이트 낮추기 (`audio_processor.py`의 `sr` 파라미터)
- 작은 파일로 테스트

#### 2. 앱이 느리거나 끊김

**해결 방법:**
- 개발 모드가 아닌 프로덕션 빌드 사용
- 햅틱 이벤트 수 줄이기 (threshold 조정)
- 기기 재시작

## 개발 환경 설정

### VS Code 추천 확장

- Python
- Pylance
- React Native Tools
- ESLint
- Prettier
- Docker

### 코드 포맷팅

**Backend (Python):**
```bash
pip install black
black backend/
```

**Frontend (JavaScript):**
```bash
npm install -g prettier
prettier --write frontend/
```

### 자동 재시작 (개발 시)

**Backend:**
```bash
pip install watchdog
watchmedo auto-restart --directory=backend --pattern="*.py" --recursive -- python backend/main.py
```

**Frontend:**
Expo는 기본적으로 파일 변경 감지 및 핫 리로드를 제공합니다.

## 프로덕션 배포

### 백엔드 배포

#### 클라우드 플랫폼에 Docker 배포

**AWS ECS, Google Cloud Run, Azure Container Instances:**
1. 컨테이너 레지스트리에 이미지 푸시
2. 클라우드 서비스에서 컨테이너 실행
3. 환경 변수 설정
4. HTTPS 설정 (Load Balancer 또는 Reverse Proxy)

**Heroku:**
```bash
heroku container:push web -a your-app-name
heroku container:release web -a your-app-name
```

### 프론트엔드 배포

#### Expo 빌드

**Android APK:**
```bash
expo build:android
```

**iOS App:**
```bash
expo build:ios
```

**EAS Build (권장):**
```bash
npm install -g eas-cli
eas build --platform android
eas build --platform ios
```

#### 앱 스토어 제출

1. Google Play Console 계정 생성
2. Apple Developer Program 가입 ($99/년)
3. 앱 아이콘 및 스크린샷 준비
4. 메타데이터 작성
5. 검토 제출

## 환경별 설정

### 개발 (Development)

```javascript
// frontend/config.js (생성)
export const API_URL = __DEV__ 
  ? 'http://10.0.2.2:8000'  // 개발
  : 'https://api.hapticbeat.com';  // 프로덕션
```

### 스테이징 (Staging)

별도의 Docker Compose 파일 생성:

```bash
docker-compose -f docker-compose.staging.yml up
```

### 프로덕션 (Production)

- HTTPS 사용
- 환경 변수로 민감한 정보 관리
- Rate limiting 설정
- 모니터링 및 로깅 (Sentry, DataDog 등)
- 백업 전략 수립

## 추가 리소스

- [FastAPI 문서](https://fastapi.tiangolo.com/)
- [librosa 튜토리얼](https://librosa.org/doc/latest/tutorial.html)
- [Expo 문서](https://docs.expo.dev/)
- [React Native 문서](https://reactnative.dev/)
- [Docker 문서](https://docs.docker.com/)

## 지원

문제가 계속되면 GitHub Issues에 다음 정보와 함께 보고해주세요:

1. 운영 체제 및 버전
2. Python/Node.js 버전
3. 오류 메시지 전체
4. 재현 단계
5. 로그 파일

---

즐거운 개발 되세요! 🎵

