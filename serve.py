# 本地静态服务器（用于桌面浏览器预览 + 同 Wi-Fi 手机访问）
# 用法：在本项目目录运行  python serve.py
# 默认监听 0.0.0.0:8090（手机连同一 Wi-Fi 可用电脑内网 IP 访问）
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import os

os.chdir(os.path.dirname(os.path.abspath(__file__)))
PORT = 8090

if __name__ == '__main__':
    print(f'Serving pet-pwa on 0.0.0.0:{PORT} ...')
    ThreadingHTTPServer(('0.0.0.0', PORT), SimpleHTTPRequestHandler).serve_forever()
