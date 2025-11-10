/**
 * AudioPlayer Component
 * 오디오 재생과 햅틱 피드백을 동기화하는 플레이어
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Slider,
} from 'react-native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';

export default function AudioPlayer({ audioUri, hapticData }) {
  const [sound, setSound] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [position, setPosition] = useState(0);
  const [currentHapticIndex, setCurrentHapticIndex] = useState(0);

  // Refs for maintaining state across renders
  const hapticIndexRef = useRef(0);
  const hapticDataRef = useRef(hapticData);

  // 컴포넌트 마운트 시 오디오 로드
  useEffect(() => {
    loadAudio();

    // 컴포넌트 언마운트 시 정리
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [audioUri]);

  // hapticData가 변경되면 업데이트
  useEffect(() => {
    hapticDataRef.current = hapticData;
    hapticIndexRef.current = 0;
    setCurrentHapticIndex(0);
  }, [hapticData]);

  /**
   * 오디오 파일 로드
   */
  const loadAudio = async () => {
    setIsLoading(true);
    try {
      // 오디오 모드 설정
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        shouldDuckAndroid: true,
      });

      // 사운드 로드
      const { sound: loadedSound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: false },
        onPlaybackStatusUpdate
      );

      setSound(loadedSound);

      // 오디오 길이 가져오기
      const status = await loadedSound.getStatusAsync();
      if (status.isLoaded) {
        setDuration(status.durationMillis / 1000);
      }
    } catch (error) {
      console.error('오디오 로드 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 재생 상태 업데이트 콜백
   * 현재 재생 위치를 추적하고 햅틱 이벤트를 트리거
   */
  const onPlaybackStatusUpdate = (status) => {
    if (!status.isLoaded) {
      return;
    }

    // 재생 상태 업데이트
    setIsPlaying(status.isPlaying);
    setPosition(status.positionMillis / 1000);

    // 재생 중일 때만 햅틱 처리
    if (status.isPlaying) {
      const currentTime = status.positionMillis / 1000;
      processHaptics(currentTime);
    }

    // 재생 완료 시 초기화
    if (status.didJustFinish) {
      setIsPlaying(false);
      hapticIndexRef.current = 0;
      setCurrentHapticIndex(0);
    }
  };

  /**
   * 햅틱 이벤트 처리
   * 현재 재생 시간에 맞는 햅틱 이벤트를 트리거
   */
  const processHaptics = (currentTime) => {
    const hapticEvents = hapticDataRef.current;
    if (!hapticEvents || hapticEvents.length === 0) {
      return;
    }

    let index = hapticIndexRef.current;

    // 현재 시간에 해당하는 모든 햅틱 이벤트 처리
    while (index < hapticEvents.length) {
      const event = hapticEvents[index];

      // 햅틱 이벤트 시간과 현재 시간 비교 (0.05초 허용 오차)
      if (event.time <= currentTime + 0.05) {
        triggerHaptic(event.intensity);
        index++;
      } else {
        break;
      }
    }

    // 인덱스 업데이트
    if (index !== hapticIndexRef.current) {
      hapticIndexRef.current = index;
      setCurrentHapticIndex(index);
    }
  };

  /**
   * 햅틱 피드백 트리거
   * intensity 값에 따라 다른 강도의 진동 생성
   */
  const triggerHaptic = (intensity) => {
    try {
      if (intensity >= 0.8) {
        // 강한 진동
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } else if (intensity >= 0.5) {
        // 중간 진동
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } else {
        // 약한 진동
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('햅틱 피드백 오류:', error);
    }
  };

  /**
   * 재생/일시정지 토글
   */
  const togglePlayPause = async () => {
    if (!sound) {
      return;
    }

    try {
      const status = await sound.getStatusAsync();

      if (status.isPlaying) {
        await sound.pauseAsync();
      } else {
        await sound.playAsync();
      }
    } catch (error) {
      console.error('재생 제어 오류:', error);
    }
  };

  /**
   * 정지 (처음부터 다시 재생하기 위해)
   */
  const stopAudio = async () => {
    if (!sound) {
      return;
    }

    try {
      await sound.stopAsync();
      await sound.setPositionAsync(0);
      hapticIndexRef.current = 0;
      setCurrentHapticIndex(0);
      setPosition(0);
    } catch (error) {
      console.error('정지 오류:', error);
    }
  };

  /**
   * 시크바 변경 핸들러
   */
  const onSeek = async (value) => {
    if (!sound) {
      return;
    }

    try {
      const newPosition = value * 1000; // 초를 밀리초로 변환
      await sound.setPositionAsync(newPosition);

      // 새 위치에 맞게 햅틱 인덱스 재설정
      const newIndex = hapticDataRef.current.findIndex(
        (event) => event.time > value
      );
      hapticIndexRef.current = newIndex === -1 ? hapticDataRef.current.length : newIndex;
      setCurrentHapticIndex(hapticIndexRef.current);
    } catch (error) {
      console.error('시크 오류:', error);
    }
  };

  /**
   * 시간을 MM:SS 형식으로 변환
   */
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>오디오 로딩 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 햅틱 진행 표시 */}
      <View style={styles.hapticProgress}>
        <Text style={styles.hapticProgressText}>
          🎯 햅틱 이벤트: {currentHapticIndex} / {hapticData.length}
        </Text>
      </View>

      {/* 시간 표시 */}
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{formatTime(position)}</Text>
        <Text style={styles.timeText}>{formatTime(duration)}</Text>
      </View>

      {/* 시크바 */}
      <Slider
        style={styles.slider}
        value={position}
        minimumValue={0}
        maximumValue={duration}
        minimumTrackTintColor="#6366f1"
        maximumTrackTintColor="#334155"
        thumbTintColor="#6366f1"
        onSlidingComplete={onSeek}
      />

      {/* 컨트롤 버튼 */}
      <View style={styles.controls}>
        {/* 정지 버튼 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={stopAudio}
          disabled={!sound}
        >
          <Text style={styles.controlButtonText}>⏹️</Text>
        </TouchableOpacity>

        {/* 재생/일시정지 버튼 */}
        <TouchableOpacity
          style={[styles.controlButton, styles.playButton]}
          onPress={togglePlayPause}
          disabled={!sound}
        >
          <Text style={styles.playButtonText}>
            {isPlaying ? '⏸️' : '▶️'}
          </Text>
        </TouchableOpacity>

        {/* 햅틱 테스트 버튼 */}
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => triggerHaptic(0.8)}
        >
          <Text style={styles.controlButtonText}>📳</Text>
        </TouchableOpacity>
      </View>

      {/* 재생 상태 표시 */}
      {isPlaying && (
        <View style={styles.playingIndicator}>
          <Text style={styles.playingText}>🎵 재생 중 - 리듬을 느껴보세요!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1e293b',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  loadingText: {
    color: '#94a3b8',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  hapticProgress: {
    backgroundColor: '#0f172a',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    alignItems: 'center',
  },
  hapticProgressText: {
    color: '#6366f1',
    fontSize: 14,
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  timeText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '500',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 20,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  controlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#334155',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#475569',
  },
  controlButtonText: {
    fontSize: 28,
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#6366f1',
    borderColor: '#818cf8',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  playButtonText: {
    fontSize: 36,
  },
  playingIndicator: {
    marginTop: 20,
    backgroundColor: '#065f46',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  playingText: {
    color: '#6ee7b7',
    fontSize: 14,
    fontWeight: '600',
  },
});

