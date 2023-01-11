import Router from "koa-router";
import config from "./config";
import path from "path";
import fs from "fs";
import { exec } from "child_process";
import { deleteFolderRecursive } from "./utils";

const dirName = config.dirName;
const rtspDir = config.tempDir;
const domain = config.domain;

const streams = {};

class Single {
  static instance = null;
  timer = null;
  constructor() {
    this.timer = setInterval(() => {
      console.log("checking stream timeout");
      // 检查stream是否超时
      for (const key in streams) {
        const entry = streams[key];
        if (entry && Date.now() - entry.lastTime > 1000 * 60 * 5) {
          console.log("stream timeout, key:", key);
          delete streams[key];
          const sub = entry.process;
          if (sub) {
            sub.kill();
            // process.kill(-sub.pid);
          }
          // 删除文件夹
          const dir = path.join(rtspDir, entry.path);
          deleteFolderRecursive(dir);
        }
        console.debug('start, %d, end %d, timeout %d', Date.now(), entry.lastTime, Date.now() - entry.lastTime)
      }
      console.log("checking stream timeout finished, current length:", Object.keys(streams).length);  
    }, 1000 * 60);
  }
  static getInstance() {
    if (!Single.instance) {
      Single.instance = new Single();
    }
    return Single.instance;
  }
}

Single.getInstance();


export async function serve(ctx, next) {
  const url = ctx.request.url.slice(1);
  if (!url) {
    return;
  }

  console.log("url:", url);
  console.log("path:", url);
  // 判断是m3u8文件还是ts文件
  const isTs = url.indexOf(".ts") > -1;

  if (isTs) {
    console.log("ts request received, url:", url);
    // 如果是ts文件，直接返回
    const target = url.split("/").pop().split(".")[0].slice(0, -3);
    console.log("target:", target);
    const filePath = path.join(rtspDir, target, url.split("/").pop());
    ctx.body = fs.createReadStream(filePath);
    ctx.attachment(filePath);
    console.log("ts request finished, url:", url);
    return;
  } else {
    // 拼接m3u8文件
    // target likes rtsp://wowzaec2demo.streamlock.net/vod/mp4:BigBuckBunny_115k.mp4
    const source = url;
    console.log("m3u8 request received, source:", source);
    let targetEntry = streams[source];
    let target = "";
    if (!targetEntry) {
      console.log("no targetEntry found for source:", source);
      target = source
        .replaceAll("/", "-")
        .replaceAll(".", "-")
        .replaceAll(":", "-");
      // 当文件夹不存在时，创建文件夹.
      if (!fs.existsSync(rtspDir + "/" + target)) {
        fs.mkdirSync(rtspDir + "/" + target);
      }
      // 调用ffmpeg命令，将rtsp流转换为m3u8文件
      const realSource = `rtsp://${source}`;
      const cmd = `ffmpeg -rtsp_transport tcp -i '${realSource}' -force_key_frames "expr:gte(t,n_forced*2)" -an -c:v libx264 -strict -2 -crf 25 -f hls -hls_flags delete_segments -hls_segment_filename '${rtspDir}/${target}/${target}%03d.ts' '${rtspDir}/${target}/index.m3u8'`;
      console.log('transcode with cmd: ', cmd);
      const sub = exec(cmd, (error, stdout, stderr) => {
        if (error) {
          console.error(`执行出错: ${error}`);
          return;
        }
        console.log(`stdout: ${stdout}`);
        console.log(`stderr: ${stderr}`);
      });
      // 等待直到index文件被创建出来
      console.log("waiting for index.m3u8 to be created");
      const res = await new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
          if (fs.existsSync(path.join(rtspDir, target, "index.m3u8"))) {
            clearInterval(interval);
            console.log("index.m3u8 created");
            resolve(0);
          }
          if (Date.now() - start > 20000) {
            console.log("timeout");
            clearInterval(interval);
            resolve(-1);
          }
        }, 1000);
      });
      if (res === -1) {
        ctx.throw(500, "timeout");
        return;
      }
      targetEntry = {
        path: target,
        lastTime: Date.now(),
        process: sub,
      };
      streams[source] = targetEntry;
    } else {
      target = targetEntry.path;
      targetEntry.lastTime = Date.now();
      streams[source] = targetEntry;
      console.log("waiting for index.m3u8 to be created");
      const res = await new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
          if (fs.existsSync(path.join(rtspDir, target, "index.m3u8"))) {
            clearInterval(interval);
            console.log("index.m3u8 created");
            resolve(0);
          }
          if (Date.now() - start > 20000) {
            console.log("timeout");
            clearInterval(interval);
            // 删除当前entry（在下一次请求时将创建entry）
            const entry = streams[source];
            if (entry) {
              entry.process.kill();
            }
            deleteFolderRecursive(path.join(rtspDir, target));
            delete streams[source];
            resolve(1);
          }
        }, 1000);
      });
    }
    const filePath = path.join(rtspDir, target, "index.m3u8");
    ctx.body = fs.createReadStream(filePath);
    ctx.attachment(filePath);
    console.log("sent m3u8");
  }
}
