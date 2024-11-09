import 'package:shared_preferences/shared_preferences.dart';
import 'package:flutter/material.dart';

class SettingsService {
  static const String _isDarkKey = 'is_dark_mode';
  static const String _isMutedKey = 'is_muted';
  static const String _timerColorKey = 'timer_color';
  static const String _showTimeKey = 'show_time';

  static Future<void> saveDarkMode(bool isDark) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isDarkKey, isDark);
  }

  static Future<void> saveMuted(bool isMuted) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_isMutedKey, isMuted);
  }

  static Future<void> saveTimerColor(Color color) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt(_timerColorKey, color.value);
  }

  static Future<bool?> getDarkMode() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isDarkKey);
  }

  static Future<bool?> getMuted() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_isMutedKey);
  }

  static Future<Color?> getTimerColor() async {
    final prefs = await SharedPreferences.getInstance();
    final colorValue = prefs.getInt(_timerColorKey);
    return colorValue != null ? Color(colorValue) : null;
  }

  static Future<void> saveShowTime(bool show) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(_showTimeKey, show);
  }

  static Future<bool?> getShowTime() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool(_showTimeKey);
  }
} 