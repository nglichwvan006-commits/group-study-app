FROM ubuntu:22.04

# Tránh các prompt hỏi tương tác trong quá trình build
ENV DEBIAN_FRONTEND=noninteractive

# Cài đặt các dependencies cơ bản, C++ (g++), Python3, Java (OpenJDK 17) và công cụ đo lường (time)
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
    g++ \
    python3 \
    openjdk-17-jdk \
    wget \
    apt-transport-https \
    ca-certificates \
    time \
    && rm -rf /var/lib/apt/lists/*

# Cài đặt .NET 8 SDK (C#)
RUN wget https://packages.microsoft.com/config/ubuntu/22.04/packages-microsoft-prod.deb -O packages-microsoft-prod.deb \
    && dpkg -i packages-microsoft-prod.deb \
    && rm packages-microsoft-prod.deb \
    && apt-get update \
    && apt-get install -y dotnet-sdk-8.0 \
    && rm -rf /var/lib/apt/lists/*

# Tạo một non-root user để chạy code (Bảo mật)
RUN useradd -m -s /bin/bash judgeuser

# Copy script thực thi vào container
COPY runner.sh /sandbox/runner.sh
RUN chmod +x /sandbox/runner.sh && chown -R judgeuser:judgeuser /sandbox

# Đặt user mặc định là non-root
USER judgeuser
WORKDIR /sandbox

# Định nghĩa điểm vào
ENTRYPOINT ["/sandbox/runner.sh"]
