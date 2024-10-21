FROM python:3.11-slim

ENV DEBIAN_FRONTEND=noninteractive

# 必要なパッケージをインストール
RUN apt-get update && \
    apt-get install -y --no-install-recommends nginx supervisor && \
    rm -rf /var/lib/apt/lists/*

# 作業ディレクトリを設定
WORKDIR /app

# アプリケーションの依存関係をインストール
COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# アプリケーションコードと設定ファイルをコピー
COPY . /app

# nginxとsupervisordの設定ファイルをコピー
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# ポート8080を公開
EXPOSE 8080


# supervisordを起動
CMD ["/usr/bin/supervisord"]