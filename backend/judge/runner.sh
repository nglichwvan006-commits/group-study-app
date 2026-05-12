#!/bin/bash
# Script thực thi mã nguồn bên trong Docker container
# Input từ Node.js sẽ được pipe thẳng vào STDIN của script này.
# Usage: ./runner.sh <language> <source_file>

LANG=$1
SRC=$2

# Compile phase
case $LANG in
    "cpp")
        # Biên dịch C++
        g++ -O2 "$SRC" -o /tmp/prog
        # Nếu lỗi biên dịch, exit 200 để Node.js phân biệt Compile Error (CE) và Runtime Error (RE)
        if [ $? -ne 0 ]; then exit 200; fi
        # Định dạng output của lệnh time: %%TIME:giây%%%%MEM:KB%%
        CMD="/usr/bin/time -f %%TIME:%e%%%%MEM:%M%% /tmp/prog"
        ;;
    "python")
        # Python không cần biên dịch
        CMD="/usr/bin/time -f %%TIME:%e%%%%MEM:%M%% python3 $SRC"
        ;;
    "java")
        # Biên dịch Java
        javac -d /tmp "$SRC"
        if [ $? -ne 0 ]; then exit 200; fi
        # Giả định tên class chính luôn là Main (quy ước nộp bài Java)
        CMD="/usr/bin/time -f %%TIME:%e%%%%MEM:%M%% java -cp /tmp Main"
        ;;
    "csharp")
        # Tạo project ảo cho C#
        mkdir -p /tmp/csapp && cd /tmp/csapp
        dotnet new console -n App -o . > /dev/null
        cp "$SRC" Program.cs
        dotnet build -c Release > /dev/null
        if [ $? -ne 0 ]; then exit 200; fi
        CMD="/usr/bin/time -f %%TIME:%e%%%%MEM:%M%% ./bin/Release/net8.0/App"
        ;;
    *)
        echo "Unknown language: $LANG" >&2
        exit 200
        ;;
esac

# Execute phase
# Dùng eval để chạy lệnh đã chuẩn bị, STDIN từ Node.js sẽ tự động chảy vào lệnh này.
eval $CMD
