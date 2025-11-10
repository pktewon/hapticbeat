"""
HapticBeat Backend - FastAPI Server
음악 파일을 분석하여 햅틱 데이터를 생성하는 API 서버
"""
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import os
import tempfile
from audio_processor import process_audio

app = FastAPI(title="HapticBeat API", version="1.0.0")

# CORS 설정 - React Native 앱에서 접근 가능하도록
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 프로덕션에서는 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 임시 파일 저장 디렉토리
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@app.get("/")
async def root():
    """헬스 체크 엔드포인트"""
    return {
        "message": "HapticBeat API is running",
        "status": "healthy",
        "version": "1.0.0"
    }


@app.post("/upload_music")
async def upload_music(file: UploadFile = File(...)):
    """
    음악 파일을 업로드하고 햅틱 데이터를 생성합니다.
    
    Parameters:
    - file: 음악 파일 (MP3, WAV 등)
    
    Returns:
    - haptic_data: 햅틱 이벤트 리스트
    - metadata: 분석 메타데이터
    """
    # 파일 확장자 검증
    allowed_extensions = [".mp3", ".wav", ".m4a", ".flac", ".ogg"]
    file_extension = os.path.splitext(file.filename)[1].lower()
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"지원되지 않는 파일 형식입니다. 허용된 형식: {', '.join(allowed_extensions)}"
        )
    
    try:
        # 임시 파일로 저장
        with tempfile.NamedTemporaryFile(
            delete=False,
            suffix=file_extension,
            dir=UPLOAD_DIR
        ) as temp_file:
            # 파일 내용을 청크 단위로 읽어서 저장
            contents = await file.read()
            temp_file.write(contents)
            temp_file_path = temp_file.name
        
        # 오디오 분석 및 햅틱 데이터 생성
        haptic_data, metadata = process_audio(temp_file_path)
        
        # 임시 파일 삭제
        os.remove(temp_file_path)
        
        return JSONResponse(content={
            "success": True,
            "haptic_data": haptic_data,
            "metadata": metadata,
            "message": f"'{file.filename}' 파일이 성공적으로 분석되었습니다."
        })
    
    except Exception as e:
        # 에러 발생 시 임시 파일 정리
        if 'temp_file_path' in locals() and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
        
        raise HTTPException(
            status_code=500,
            detail=f"오디오 분석 중 오류가 발생했습니다: {str(e)}"
        )


@app.get("/health")
async def health_check():
    """서버 상태 확인"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

