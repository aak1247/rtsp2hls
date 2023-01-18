# RTSP Stream

## 部署

1. docker内已包含ffmpeg包，可以独立部署，临时文件默认目录为/app/dist/rtsp_temp (可以不挂载出来)
2. 默认端口为3001，可以在部署时修改为其他端口(``config.port``)，在前端服务的代理中配置一致即可

## 工作流程

1. 转流转码服务处理url，拼接完整rtsp地址，调用ffmpeg子进程完成转流转码，并建立临时文件夹保存当前流的临时文件
2. 定时处理当前转流中的流，超时（默认5min）后关闭子进程并删除临时文件

## Example

> 请求rtsp流地址为：``rtsp://1@2:xxx.bbb``，``rtsp-stream``服务部署地址为：``http://localhost:3001``，则请求``http://localhost:3001/rtsp://1@2:xxx.bbb``即可得到hls流