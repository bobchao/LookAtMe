import 'dart:async';
import 'package:flutter/foundation.dart';
import 'sound_controller.dart';

class TimerController extends ChangeNotifier {
  final SoundController soundController;
  Timer? _timer;
  int _remainingSeconds = 0;
  bool _isRunning = false;

  TimerController({required this.soundController});

  bool get isRunning => _isRunning;
  int get remainingSeconds => _remainingSeconds;

  void setTime(int minutes) {
    _remainingSeconds = minutes * 60;
    notifyListeners();
  }

  void start() {
    if (_remainingSeconds > 0 && !_isRunning) {
      _isRunning = true;
      _timer = Timer.periodic(const Duration(seconds: 1), _tick);
      notifyListeners();
    }
  }

  void _tick(Timer timer) {
    if (_remainingSeconds > 0) {
      _remainingSeconds--;
      notifyListeners();
    } else {
      stop();
      soundController.playBell();
    }
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _isRunning = false;
    notifyListeners();
  }

  void reset() {
    stop();
    _remainingSeconds = 0;
    notifyListeners();
  }

  void pause() {
    if (_isRunning) {
      stop();
    } else {
      start();
    }
  }

  @override
  void dispose() {
    _timer?.cancel();
    super.dispose();
  }
} 