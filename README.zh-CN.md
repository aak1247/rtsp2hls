# RTSP2HLS

| [English](./README.md) | 简体中文 |

## 部署

```bash
docker run -d -p 3001:3001 --name rtsp2hsl aak1247/rtsp2hsl
```

1. docker内已包含ffmpeg包，可以独立部署，临时文件默认目录为/app/dist/rtsp_temp (可以不挂载出来)
2. 默认端口为3001

## 工作流程

1. 转流转码服务处理url，拼接完整rtsp地址，调用ffmpeg子进程完成转流转码，并建立临时文件夹保存当前流的临时文件
2. 定时处理当前转流中的流，超时（默认5min）后关闭子进程并删除临时文件

## Example

> 请求rtsp流地址为：``rtsp://1@2:xxx.bbb``，``rtsp2hls``服务部署地址为：``http://localhost:3001``，则请求``http://localhost:3001/rtsp://1@2:xxx.bbb``即可得到hls流
