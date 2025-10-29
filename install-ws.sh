#!/bin/bash
apt update -y
apt install -y python2
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo 'deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main' | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install cloudflared
sudo cloudflared service install eyJhIjoiYzQ4OTA0MWRjOTNlZTM1YTE4ZWRhYTBhMDBiOWIzNDEiLCJ0IjoiZWU1MTlkNWYtZDY5Yi00YmZhLTk4ZTUtOGZlMTEyN2Q0M2Q4IiwicyI6Ik5EY3lOR05qTnpZdE0yWTBaUzAwTURabUxUZzJOVFV0TkRKa09UWTBPVFJoTnpGayJ9
chmod +x websocket973.py
useradd -e 2025-12-31 Hola && echo "Hola:Mundo" | chpasswd
python2 websocket973.py 8080
