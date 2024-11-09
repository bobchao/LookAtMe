import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/foundation.dart';
import '../services/settings_service.dart';

class SoundController extends ChangeNotifier {
  AudioPlayer? _player;
  bool _isMuted = false;
  bool _isInitialized = false;

  SoundController() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    _isMuted = await SettingsService.getMuted() ?? false;
    notifyListeners();
  }

  bool get isMuted => _isMuted;

  Future<void> initialize() async {
    if (_isInitialized) return;
    _player = AudioPlayer();
    if (kIsWeb) {
      // Web 平台下延遲載入音效，等待用戶互動
      _isInitialized = true;
    }
  }

  Future<void> _ensureInitialized() async {
    if (!_isInitialized || _player == null) {
      await initialize();
    }
    if (kIsWeb && _player != null) {
      // Web 平台下每次播放前重新設置音源
      await _player!.setSource(AssetSource('sounds/bell-sound.mp3'));
    }
  }

  Future<void> playBell() async {
    if (_isMuted) return;
    
    await _ensureInitialized();
    if (_player != null) {
      if (kIsWeb) {
        await _player!.resume();
      } else {
        await _player!.play(AssetSource('sounds/bell-sound.mp3'));
      }
    }
  }

  void toggleMute() {
    _isMuted = !_isMuted;
    SettingsService.saveMuted(_isMuted);
    notifyListeners();
  }

  @override
  void dispose() {
    _player?.dispose();
    super.dispose();
  }
} 