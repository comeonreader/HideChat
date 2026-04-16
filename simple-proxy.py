#!/usr/bin/env python3
"""
简单的HTTP反向代理，将端口8081转发到5173
解决局域网访问问题
"""
import http.server
import socketserver
import urllib.request
import urllib.parse

PORT = 8081
TARGET_PORT = 5173
TARGET_HOST = 'localhost'

class ProxyHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        try:
            # 构建目标URL
            target_url = f"http://{TARGET_HOST}:{TARGET_PORT}{self.path}"
            
            # 添加请求头
            headers = {}
            for key, value in self.headers.items():
                if key.lower() not in ['host', 'connection']:
                    headers[key] = value
            
            # 转发请求
            req = urllib.request.Request(target_url, headers=headers, method='GET')
            with urllib.request.urlopen(req) as response:
                # 获取响应内容
                content = response.read()
                
                # 发送响应头
                self.send_response(response.status)
                for key, value in response.headers.items():
                    if key.lower() not in ['transfer-encoding', 'connection']:
                        self.send_header(key, value)
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                
                # 发送响应内容
                self.wfile.write(content)
                
        except Exception as e:
            self.send_error(500, f"Proxy error: {str(e)}")
    
    def do_POST(self):
        self.do_GET()
    
    def log_message(self, format, *args):
        # 减少日志输出
        pass

if __name__ == '__main__':
    print(f"启动反向代理服务器...")
    print(f"本地地址: http://0.0.0.0:{PORT}")
    print(f"目标地址: http://{TARGET_HOST}:{TARGET_PORT}")
    print(f"局域网访问: http://<您的IP>:{PORT}")
    print("按 Ctrl+C 停止")
    
    with socketserver.TCPServer(("0.0.0.0", PORT), ProxyHandler) as httpd:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n服务器已停止")