import 'package:flutter/material.dart';
import 'dart:html' as html;

class WebFallbackPage extends StatelessWidget {
  const WebFallbackPage({super.key});

  @override
  Widget build(BuildContext context) {
    // 在 Web 平台上，直接重定向到原始網站
    html.window.location.href = 'https://bobchao.github.io/LookAtMe/';
    
    // 這個 return 實際上不會被執行到，因為已經重定向了
    return const Center(
      child: CircularProgressIndicator(),
    );
  }
} 