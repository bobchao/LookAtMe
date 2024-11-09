import 'package:flutter/material.dart';
import '../widgets/timer_widget.dart';
import 'package:flutter/foundation.dart';
import 'dart:js' as js;
import 'package:provider/provider.dart';
import '../controllers/sound_controller.dart';
import '../controllers/theme_controller.dart';
import 'package:flutter_colorpicker/flutter_colorpicker.dart';

class TimerPage extends StatefulWidget {
  const TimerPage({super.key});

  @override
  State<TimerPage> createState() => _TimerPageState();
}

class _TimerPageState extends State<TimerPage> with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  bool _isSettingsVisible = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 300),
      vsync: this,
    );
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleSettings() {
    setState(() {
      _isSettingsVisible = !_isSettingsVisible;
      if (_isSettingsVisible) {
        _controller.forward();
      } else {
        _controller.reverse();
      }
    });
  }

  Widget _buildSettingButton({
    required Widget child,
    required double position,
  }) {
    return AnimatedBuilder(
      animation: _controller,
      builder: (context, child) {
        final offset = Tween(
          begin: const Offset(0, 48.0),
          end: Offset(0, -position),
        ).animate(CurvedAnimation(
          parent: _controller,
          curve: Curves.easeOutBack,
        ));

        return Positioned(
          right: 16,
          bottom: 16,
          child: Transform.translate(
            offset: offset.value,
            child: child,
          ),
        );
      },
      child: child,
    );
  }

  void _showColorPicker(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('選擇顏色'),
        backgroundColor: isDark ? const Color(0xFF333333) : Colors.white,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Wrap(
              spacing: 10,
              runSpacing: 10,
              children: [
                ...ThemeController.predefinedColors.map((color) {
                  return InkWell(
                    onTap: () {
                      context.read<ThemeController>().setTimerColor(color);
                      Navigator.of(context).pop();
                    },
                    child: Container(
                      width: 50,
                      height: 50,
                      decoration: BoxDecoration(
                        color: color,
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: isDark ? Colors.white24 : Colors.black12,
                          width: 2,
                        ),
                      ),
                      child: context.watch<ThemeController>().timerColor == color
                          ? Icon(
                              Icons.check,
                              color: color.computeLuminance() > 0.5
                                  ? Colors.black
                                  : Colors.white,
                            )
                          : null,
                    ),
                  );
                }),
                InkWell(
                  onTap: () {
                    Navigator.of(context).pop();
                    _showCustomColorPicker(context);
                  },
                  child: Container(
                    width: 50,
                    height: 50,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(
                        color: isDark ? Colors.white24 : Colors.black12,
                        width: 2,
                      ),
                    ),
                    child: Icon(
                      Icons.add,
                      color: isDark ? Colors.white70 : Colors.black54,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  void _showCustomColorPicker(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    Color pickerColor = context.read<ThemeController>().timerColor;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('自定義顏色'),
        backgroundColor: isDark ? const Color(0xFF333333) : Colors.white,
        content: SingleChildScrollView(
          child: ColorPicker(
            pickerColor: pickerColor,
            onColorChanged: (color) {
              pickerColor = color;
            },
            pickerAreaHeightPercent: 0.8,
          ),
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: const Text('取消'),
          ),
          TextButton(
            onPressed: () {
              context.read<ThemeController>().setTimerColor(pickerColor);
              Navigator.of(context).pop();
            },
            child: const Text('確定'),
          ),
        ],
      ),
    );
  }

  void _showInfoDialog(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('關於'),
        backgroundColor: isDark ? const Color(0xFF333333) : Colors.white,
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text('音效來源：'),
            InkWell(
              onTap: () {
                js.context.callMethod('open', ['https://freesound.org/s/557923/', '_blank']);
              },
              child: const Text(
                'Bell sound by ConBlast, CC:BY 3.0',
                style: TextStyle(
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
            const SizedBox(height: 16),
            const Text('程式碼：'),
            InkWell(
              onTap: () {
                js.context.callMethod('open', ['https://github.com/bobchao/LookAtMe', '_blank']);
              },
              child: const Text(
                'GitHub Repository',
                style: TextStyle(
                  color: Colors.blue,
                  decoration: TextDecoration.underline,
                ),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
            },
            child: const Text('關閉'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      backgroundColor: isDark ? const Color(0xFF333333) : Colors.white,
      body: Stack(
        children: [
          Center(
            child: ConstrainedBox(
              constraints: const BoxConstraints(
                maxWidth: 600,
                maxHeight: 600,
              ),
              child: AspectRatio(
                aspectRatio: 1,
                child: Padding(
                  padding: const EdgeInsets.all(20),
                  child: TimerWidget(),
                ),
              ),
            ),
          ),
          
          // 時間顯示設定按鈕
          _buildSettingButton(
            position: 192.0,
            child: Consumer<ThemeController>(
              builder: (context, theme, child) {
                return IconButton(
                  icon: Icon(
                    theme.showTime ? Icons.timer : Icons.timer_off,
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                  onPressed: _isSettingsVisible ? theme.toggleTimeDisplay : null,
                  tooltip: theme.showTime ? '隱藏時間' : '顯示時間',
                );
              },
            ),
          ),

          // 顏色選擇按鈕
          _buildSettingButton(
            position: 144.0,
            child: IconButton(
              icon: Icon(
                Icons.palette,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              onPressed: _isSettingsVisible ? () => _showColorPicker(context) : null,
              tooltip: '選擇顏色',
            ),
          ),

          // 深色模式切換按鈕
          _buildSettingButton(
            position: 96.0,
            child: Consumer<ThemeController>(
              builder: (context, theme, child) {
                return IconButton(
                  icon: Icon(
                    theme.isDark ? Icons.light_mode : Icons.dark_mode,
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                  onPressed: _isSettingsVisible ? theme.toggleTheme : null,
                  tooltip: theme.isDark ? '切換至淺色模式' : '切換至深色模式',
                );
              },
            ),
          ),

          // 靜音按鈕
          _buildSettingButton(
            position: 48.0,
            child: Consumer<SoundController>(
              builder: (context, sound, child) {
                return IconButton(
                  icon: Icon(
                    sound.isMuted ? Icons.volume_off : Icons.volume_up,
                    color: isDark ? Colors.white70 : Colors.black54,
                  ),
                  onPressed: _isSettingsVisible ? sound.toggleMute : null,
                  tooltip: sound.isMuted ? '開啟音效' : '關閉音效',
                );
              },
            ),
          ),

          // 資訊按鈕（在其他設定按鈕之前）
          _buildSettingButton(
            position: 240.0,  // 在時間顯示按鈕上方
            child: IconButton(
              icon: Icon(
                Icons.info_outline,
                color: isDark ? Colors.white70 : Colors.black54,
              ),
              onPressed: _isSettingsVisible ? () => _showInfoDialog(context) : null,
              tooltip: '關於',
            ),
          ),

          // 設定按鈕
          Positioned(
            right: 16,
            bottom: 16,
            child: IconButton(
              icon: AnimatedRotation(
                duration: const Duration(milliseconds: 300),
                turns: _isSettingsVisible ? 0.125 : 0,
                child: Icon(
                  Icons.settings,
                  color: isDark ? Colors.white70 : Colors.black54,
                ),
              ),
              onPressed: _toggleSettings,
              tooltip: _isSettingsVisible ? '隱藏設定' : '顯示設定',
            ),
          ),
        ],
      ),
    );
  }
} 