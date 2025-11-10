"""
Audio Processing Module
librosa를 사용하여 음악 파일을 분석하고 햅틱 데이터를 생성합니다.
"""
import librosa
import numpy as np
from typing import List, Dict, Tuple


def process_audio(file_path: str) -> Tuple[List[Dict], Dict]:
    """
    음악 파일을 분석하여 햅틱 데이터를 생성합니다.
    
    Parameters:
    - file_path: 분석할 오디오 파일 경로
    
    Returns:
    - haptic_data: 햅틱 이벤트 리스트 [{"time": float, "intensity": float, "duration": float}, ...]
    - metadata: 분석 메타데이터 (총 길이, BPM, 이벤트 수 등)
    """
    # 1. 오디오 파일 로드
    y, sr = librosa.load(file_path, sr=None)
    duration = librosa.get_duration(y=y, sr=sr)
    
    # 2. 비트(박자) 검출
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    beat_times = librosa.frames_to_time(beat_frames, sr=sr)
    
    # 3. RMS (Root Mean Square) 에너지 계산 - 음악의 강도/진폭
    rms = librosa.feature.rms(y=y, frame_length=2048, hop_length=512)[0]
    rms_times = librosa.frames_to_time(np.arange(len(rms)), sr=sr, hop_length=512)
    
    # 4. Onset Strength (타격감) 계산 - 더 정확한 햅틱 타이밍을 위해
    onset_env = librosa.onset.onset_strength(y=y, sr=sr)
    onset_times = librosa.frames_to_time(np.arange(len(onset_env)), sr=sr)
    
    # 5. 스펙트럴 센트로이드 (음색의 밝기) - 추가적인 강도 변조
    spectral_centroid = librosa.feature.spectral_centroid(y=y, sr=sr)[0]
    spectral_times = librosa.frames_to_time(np.arange(len(spectral_centroid)), sr=sr)
    
    # 6. 햅틱 데이터 생성
    haptic_events = []
    
    for beat_time in beat_times:
        # 각 비트 시간에 대해 가장 가까운 RMS 값 찾기
        rms_idx = np.argmin(np.abs(rms_times - beat_time))
        rms_value = rms[rms_idx]
        
        # Onset strength 값 찾기
        onset_idx = np.argmin(np.abs(onset_times - beat_time))
        onset_value = onset_env[onset_idx]
        
        # 스펙트럴 센트로이드 값 찾기
        spectral_idx = np.argmin(np.abs(spectral_times - beat_time))
        spectral_value = spectral_centroid[spectral_idx]
        
        # 강도 계산 (여러 특징을 조합)
        # RMS: 60%, Onset: 30%, Spectral: 10%
        combined_intensity = (
            0.6 * (rms_value / np.max(rms)) +
            0.3 * (onset_value / np.max(onset_env)) +
            0.1 * (spectral_value / np.max(spectral_centroid))
        )
        
        # 0.0 ~ 1.0 범위로 정규화
        normalized_intensity = float(np.clip(combined_intensity, 0.0, 1.0))
        
        # 약한 비트는 필터링 (임계값 0.2 이하)
        if normalized_intensity < 0.2:
            continue
        
        # 지속 시간 계산 (강도에 따라 조절)
        # 강한 비트는 더 길게 (0.05 ~ 0.15초)
        duration = 0.05 + (normalized_intensity * 0.1)
        
        haptic_events.append({
            "time": float(beat_time),
            "intensity": normalized_intensity,
            "duration": float(duration)
        })
    
    # 7. 추가 햅틱 이벤트 생성 (비트 사이의 강한 onset 감지)
    # 더 풍부한 햅틱 경험을 위해
    onset_frames = librosa.onset.onset_detect(
        y=y, 
        sr=sr, 
        units='time',
        backtrack=True,
        pre_max=20,
        post_max=20,
        pre_avg=100,
        post_avg=100,
        delta=0.2,
        wait=30
    )
    
    for onset_time in onset_frames:
        # 이미 비트 이벤트와 너무 가까운 것은 제외 (0.1초 이내)
        if any(abs(event["time"] - onset_time) < 0.1 for event in haptic_events):
            continue
        
        # Onset 위치의 강도 계산
        onset_idx = np.argmin(np.abs(onset_times - onset_time))
        onset_value = onset_env[onset_idx]
        normalized_intensity = float(np.clip(onset_value / np.max(onset_env), 0.0, 1.0))
        
        # 약한 onset은 제외
        if normalized_intensity < 0.3:
            continue
        
        haptic_events.append({
            "time": float(onset_time),
            "intensity": normalized_intensity * 0.7,  # 비트보다 약하게
            "duration": 0.05
        })
    
    # 시간순으로 정렬
    haptic_events.sort(key=lambda x: x["time"])
    
    # 8. 메타데이터 생성
    metadata = {
        "duration": float(duration),
        "tempo_bpm": float(tempo),
        "sample_rate": int(sr),
        "total_events": len(haptic_events),
        "beat_events": len(beat_times),
        "onset_events": len(onset_frames)
    }
    
    return haptic_events, metadata


def generate_simple_haptics(file_path: str, interval: float = 0.5) -> List[Dict]:
    """
    간단한 햅틱 패턴 생성 (테스트용)
    일정 간격으로 동일한 강도의 햅틱 생성
    
    Parameters:
    - file_path: 오디오 파일 경로
    - interval: 햅틱 이벤트 간격 (초)
    
    Returns:
    - haptic_data: 햅틱 이벤트 리스트
    """
    y, sr = librosa.load(file_path, sr=None)
    duration = librosa.get_duration(y=y, sr=sr)
    
    haptic_events = []
    current_time = 0.0
    
    while current_time < duration:
        haptic_events.append({
            "time": current_time,
            "intensity": 0.7,
            "duration": 0.1
        })
        current_time += interval
    
    return haptic_events

