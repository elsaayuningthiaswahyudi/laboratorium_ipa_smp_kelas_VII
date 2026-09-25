#!/bin/bash
# Pindah ke direktori tempat script ini berada
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$DIR"

# Cek apakah port 5500 sudah dipakai, jika tidak, jalankan server
lsof -i:5500 >/dev/null 2>&1
if [ $? -ne 0 ]; then
    if [ -f "server.py" ]; then
        python3 server.py 5500 &
    else
        python3 -m http.server 5500 &
    fi
    sleep 1
fi

# Buka halaman di browser default (Mac menggunakan command 'open')
open http://localhost:5500

