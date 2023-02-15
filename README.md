# RTSP2HLS

| English | [简体中文](./README.zh-CN.md) |

## Deploy

```bash
docker run -d -p 3001:3001 --name rtsp2hsl aak1247/rtsp2hsl
```

1. docker image already contains ffmpeg package, can be deployed independently, the default temporary file directory is /app/dist/rtsp_temp.
2. default port is 3001

## Workflow

1. The rtsp2hls service handles the url, concatenates the complete rtsp address, calls the ffmpeg sub-process to complete the rtsp to hls conversion, and creates a temporary folder to save the temporary files of the current stream.
2. Periodically process the current stream, close the sub-process and delete the temporary file after timeout (default 5min)

## Example

> If Request rtsp stream address: ``rtsp://1@2:xxx.bbb``, ``rtsp-stream`` service deployment address: ``http://localhost:3001``, then request ``http://localhost:3001/rtsp://1@2:xxx.bbb`` to get hls stream
