# omall-node
洋葱微信机器人

## 注意
1. puppeteer依赖Chromium，安装时十分缓慢，改成手动下载，代码中通过executablePath关联，下载之后放到项目根目录下，目录结构`puppeteer/chrome-win/chrome.exe`
2. `npm i`之前先运行`npm i --save puppeteer --ignore-scripts` 忽略chromium的下载