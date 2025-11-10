/**
 * HapticBeat - Main App Component
 * 음악 파일 업로드 및 햅틱 플레이어 메인 화면
 */
import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Alert,
  StatusBar,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import AudioPlayer from './components/AudioPlayer';

// 백엔드 API URL - 개발 환경에 맞게 수정하세요
// Android Emulator: http://10.0.2.2:8000
// iOS Simulator: http://localhost:8000
// 실제 기기: http://YOUR_COMPUTER_IP:8000
const API_URL = 'http://10.0.2.2:8000';

export default function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [hapticData, setHapticData] = useState(null);
  const [metadata, setMetadata] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * 음악 파일 선택 핸들러
   */
  const pickMusicFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'audio/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'cancel' || result.canceled) {
        return;
      }

      // Expo SDK 버전에 따라 result 구조가 다를 수 있음
      const file = result.assets ? result.assets[0] : result;

      setSelectedFile(file);
      setError(null);
      
      // 파일 선택 후 자동으로 업로드 및 분석
      await uploadAndAnalyze(file);
    } catch (err) {
      console.error('파일 선택 오류:', err);
      Alert.alert('오류', '파일을 선택하는 중 오류가 발생했습니다.');
    }
  };

  /**
   * 백엔드로 파일 업로드 및 분석 요청
   */
  const uploadAndAnalyze = async (file) => {
    setIsLoading(true);
    setError(null);

    try {
      // FormData 생성
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        type: file.mimeType || 'audio/mpeg',
        name: file.name || 'music.mp3',
      });

      // API 요청
      const response = await fetch(`${API_URL}/upload_music`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || '분석 실패');
      }

      const data = await response.json();

      if (data.success) {
        setHapticData(data.haptic_data);
        setMetadata(data.metadata);
        Alert.alert('성공', data.message || '분석이 완료되었습니다!');
      } else {
        throw new Error('분석에 실패했습니다.');
      }
    } catch (err) {
      console.error('업로드 오류:', err);
      setError(err.message);
      Alert.alert('오류', `파일 분석 중 오류가 발생했습니다:\n${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 초기화 핸들러
   */
  const resetApp = () => {
    setSelectedFile(null);
    setHapticData(null);
    setMetadata(null);
    setError(null);
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>🎵 HapticBeat</Text>
        <Text style={styles.headerSubtitle}>음악을 느껴보세요</Text>
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.contentContainer}
      >
        {/* 파일 선택 버튼 */}
        {!selectedFile && (
          <View style={styles.uploadSection}>
            <TouchableOpacity
              style={styles.uploadButton}
              onPress={pickMusicFile}
              disabled={isLoading}
            >
              <Text style={styles.uploadButtonIcon}>🎵</Text>
              <Text style={styles.uploadButtonText}>
                음악 파일 선택
              </Text>
              <Text style={styles.uploadButtonHint}>
                MP3, WAV, M4A 등
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 로딩 인디케이터 */}
        {isLoading && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loadingText}>음악 분석 중...</Text>
            <Text style={styles.loadingHint}>
              비트와 리듬을 분석하고 있습니다
            </Text>
          </View>
        )}

        {/* 선택된 파일 정보 */}
        {selectedFile && !isLoading && (
          <View style={styles.fileInfo}>
            <Text style={styles.fileInfoLabel}>선택된 파일</Text>
            <Text style={styles.fileInfoName}>{selectedFile.name}</Text>
            {metadata && (
              <View style={styles.metadata}>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>길이</Text>
                  <Text style={styles.metadataValue}>
                    {Math.floor(metadata.duration / 60)}:
                    {Math.floor(metadata.duration % 60).toString().padStart(2, '0')}
                  </Text>
                </View>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>BPM</Text>
                  <Text style={styles.metadataValue}>
                    {Math.round(metadata.tempo_bpm)}
                  </Text>
                </View>
                <View style={styles.metadataItem}>
                  <Text style={styles.metadataLabel}>햅틱 이벤트</Text>
                  <Text style={styles.metadataValue}>
                    {metadata.total_events}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* 오디오 플레이어 */}
        {selectedFile && hapticData && !isLoading && (
          <View style={styles.playerSection}>
            <AudioPlayer
              audioUri={selectedFile.uri}
              hapticData={hapticData}
            />
          </View>
        )}

        {/* 에러 메시지 */}
        {error && (
          <View style={styles.errorSection}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* 새로운 파일 선택 버튼 */}
        {selectedFile && (
          <TouchableOpacity
            style={styles.newFileButton}
            onPress={resetApp}
          >
            <Text style={styles.newFileButtonText}>
              다른 파일 선택
            </Text>
          </TouchableOpacity>
        )}

        {/* 앱 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            이 앱은 음악의 비트와 리듬을 분석하여{'\n'}
            햅틱(진동) 피드백으로 변환합니다.
          </Text>
          <Text style={styles.infoHint}>
            💡 음악을 재생하면 리듬에 맞춰 진동을 느낄 수 있습니다.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    backgroundColor: '#1e293b',
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
  },
  uploadSection: {
    marginBottom: 20,
  },
  uploadButton: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#818cf8',
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  uploadButtonIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  uploadButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  uploadButtonHint: {
    fontSize: 14,
    color: '#c7d2fe',
  },
  loadingSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginTop: 15,
  },
  loadingHint: {
    fontSize: 14,
    color: '#94a3b8',
    marginTop: 5,
  },
  fileInfo: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  fileInfoLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  fileInfoName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 15,
  },
  metadata: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  metadataItem: {
    alignItems: 'center',
  },
  metadataLabel: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 5,
  },
  metadataValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#6366f1',
  },
  playerSection: {
    marginBottom: 20,
  },
  errorSection: {
    backgroundColor: '#7f1d1d',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#991b1b',
  },
  errorText: {
    fontSize: 14,
    color: '#fecaca',
    textAlign: 'center',
  },
  newFileButton: {
    backgroundColor: '#334155',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#475569',
  },
  newFileButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoSection: {
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoText: {
    fontSize: 14,
    color: '#cbd5e1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 10,
  },
  infoHint: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
  },
});

