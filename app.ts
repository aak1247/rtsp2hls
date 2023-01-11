import Koa from "koa";
import logger from 'koa-logger'
import fs from "fs";
import path from "path";
import cors from "koa2-cors";
import { serve } from "./src/httpRouter";
import config from "./src/config";
import { deleteFolderRecursive } from "./src/utils";

const app = new Koa();

console.log(`server vfile root is ${__dirname}`);

// 启动时清理rtspDir
const rtspDir = config.tempDir;
if (!fs.existsSync(rtspDir)) {
  fs.mkdirSync(rtspDir);
}
if (fs.existsSync(rtspDir)) {
  fs.readdirSync(rtspDir).forEach((file) => {
    const curPath = path.join(rtspDir, file);
    deleteFolderRecursive(curPath);
  });
}

app.use(logger())

app.use(
  cors({
    origin: function (ctx) {
      return ctx.request.header.origin;
    },
    credentials: true,
  })
);

app.use(serve)

app.listen(config.port);

app.on("error", async (err, ctx) => {
  console.error("error:", err);
});

console.log(`Server running on port ${config.port}`);


process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});