FROM python:3.11

# 必要なパッケージをインストール
RUN apt-get update && apt-get install -y nginx supervisor

# 作業ディレクトリを設定
WORKDIR /app

# アプリケーションの依存関係をインストール
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードと設定ファイルをコピー
COPY . .
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ポート8080を公開
EXPOSE 8080

# supervisordを起動
CMD ["/usr/bin/supervisord"]
