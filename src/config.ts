const port = 3001;
const config = {
  retry: 3, // retry 3 times
  dirName: 'rtsp_temp', // temp dir name
  tempDir: __dirname + "/../rtsp_temp", // temp dir
  port, // http port
  domain: `http://localhost:${port}/`, // domain
};
export default config;
