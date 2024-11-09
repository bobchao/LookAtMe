import 'package:flutter/material.dart';
import '../services/settings_service.dart';

class ThemeController extends ChangeNotifier {
  bool _isDark = false;
  Color _timerColor = Colors.green;
  bool _showTime = true;

  ThemeController() {
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    _isDark = await SettingsService.getDarkMode() ?? false;
    _timerColor = await SettingsService.getTimerColor() ?? Colors.green;
    _showTime = await SettingsService.getShowTime() ?? true;
    notifyListeners();
  }

  bool get isDark => _isDark;
  Color get timerColor => _timerColor;
  bool get showTime => _showTime;
  ThemeMode get themeMode => _isDark ? ThemeMode.dark : ThemeMode.light;

  void toggleTheme() {
    _isDark = !_isDark;
    SettingsService.saveDarkMode(_isDark);
    notifyListeners();
  }

  void toggleTimeDisplay() {
    _showTime = !_showTime;
    SettingsService.saveShowTime(_showTime);
    notifyListeners();
  }

  void setTimerColor(Color color) {
    _timerColor = color;
    SettingsService.saveTimerColor(color);
    notifyListeners();
  }

  static const List<Color> predefinedColors = [
    Colors.green,
    Colors.blue,
    Colors.red,
    Colors.orange,
    Colors.purple,
  ];
} 