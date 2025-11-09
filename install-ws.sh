#!/bin/bash
apt update -y
apt install -y python2
chmod +x websocket973.py

# Usa el puerto que Cloud Run asigna
PORT=${PORT:-8080}

useradd -e 2025-12-31 Hola && echo "Hola:Mundo" | chpasswd

echo "Iniciando WebSocket en puerto $PORT ..."
python2 websocket973.py $PORT
