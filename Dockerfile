FROM ubuntu:20.04
EXPOSE 8080
WORKDIR /
RUN apt update && apt install python2 -y
COPY websocket973.py
COPY install-ws.sh
RUN chmod +x install-ws.sh
RUN chmod +x websocket973.py
ENTRYPOINT ["./install-ws.sh"]
