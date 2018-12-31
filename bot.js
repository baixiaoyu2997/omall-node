const {
  FileBox
} = require('file-box')
const {
  Wechaty
} = require('wechaty')
const CronJob = require('cron').CronJob
const puppeteer = require('puppeteer-cn')
const devices = require('puppeteer/DeviceDescriptors')
const iPhonex = devices['iPhone X']
const request = require('request-promise')
const serverChanURL = 'http://sc.ftqq.com/SCU38429T43c27922fdf539ec0a9791d088c10f4f5c273333a8114.send'
let userArr = [{
  alias: 'self',
  room: '测试群',
  webPageURL: 'https://m.msyc.cc/wx/actapp/hotsale/index.html?id=21&tmn=312954'
}, {
  alias: '小<img class="emoji emoji1f424" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />崽',
  room: '洋葱海外优享',
  webPageURL: 'https://m.msyc.cc/wx/actapp/hotsale/index.html?id=21&tmn=312954'
}]

let omallTop = {
  beautyPage: {
    matchMsg: ' 美护',
    imgURL: 'beauty.jpeg'
  },
  healthPage: {
    matchMsg: ' 保健',
    imgURL: 'health.jpeg'
  },
  babyPage: {
    matchMsg: ' 母婴',
    imgURL: 'baby.jpeg'
  },
  morePage: {
    matchMsg: ' 综合',
    imgURL: 'more.jpeg'
  },
  hotSalesPage: {
    matchMsg: ' 每日',
    imgURL: 'hotSales.jpeg'
  }
};
(async function () {
  cornHandler() //启动定时器任务

  bot = new Wechaty({
    name: '机器人'
  })
  bot
    .on('scan', (qrcode, status) =>
      console.log(
        `Scan QR Code to login: ${status}\nhttps://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
          qrcode
        )}`
      )
    )
    .on('login', async user => {
      console.log(`User ${user} logined`)
    })
    .on('message', async message => {
      if (message.self() && message.room()) return // 过滤发送消息
      if (message.to().id === 'filehelper') {
        messageHandler(message, userArr.find(x => x.alias === 'self'))
      } else {
        const fromAlias = await message.from().alias()
        const user = userArr.find(x => fromAlias === x.alias)
        if (user) messageHandler(message, user)
      }
    })

  bot.start()
})()

// 定时任务
function cornHandler() {
  new CronJob(
    '0 0 12,18-21 * * *', //每天12点触发一次
    function () {
      console.log('整点报时了~~~~')
    },
    null,
    true,
    'Asia/Shanghai'
  )
}

// 处理消息指令
async function messageHandler(message, user) {
  let page = omallTop[Object.keys(omallTop).find(obj => omallTop[obj].matchMsg === message.text())]
  if (page) {
    // 获取群
    const omall_room = await bot.Room.find({
      topic: user.room
    })
    await getPic(page.imgURL, message.text(), user.webPageURL)
    const img = await FileBox.fromFile(page.imgURL);
    await omall_room.say(img)
    await omall_room.say("洋葱热卖榜单：" + user.webPageURL)
  } else if (message.text() === ' 帮助') {
    const helpInfo = Object.values(omallTop).reduce((x, y) => {
      return x + (y.matchMsg || '')
    }, '')
    message[user.alias !== 'self' ? 'from' : 'to']().say(`帮助：${helpInfo}`)
  } else {
    return
  }
}

// 获取截图
async function getPic(path, text, webPageURL) {
  const browser = await puppeteer.launch({
    // headless: false
    executablePath: "./puppeteer/chrome-win/chrome.exe"
  })
  const page = await browser.newPage()
  await page.emulate(iPhonex)
  await page.goto(webPageURL, {
    waitUntil: 'networkidle0'
  })
  // 找到文字对应nav
  const navIndex = await page.evaluate(text => {
    return [...document.querySelectorAll('.app-menu li')].findIndex(item => {
      return item.innerText.includes(text.trim())
    })
  }, text);

  if (navIndex !== 0) {
    // 点击nav显示商品列表
    await page.click(`.app-menu li:nth-child(${navIndex + 1})`)
    // 等待图片加载完成
    await page.waitForResponse(response => response.url().includes('aborder'));
  }

  await page.screenshot({
    path,
    type: 'jpeg',
    clip: {
      x: 0,
      y: 290,
      width: 375.2,
      height: 4000 //1340
    }
  })
  await browser.close()
}
// 发送警告到手机
async function sendMessage(title, content) {
  let result = JSON.parse(await request(serverChanURL, {
    qs: {
      text: title,
      desp: content
    }
  }));
  if (result.errno !== 0) throw new Error(result.errmsg);
};

process.on('uncaughtException', async function (error) {
  console.error('uncaughtException', error);
  await sendMessage('uncaughtException', error.message)
  process.exit(1);
});
// 当没有对 Promise 的 rejection 进行处理就会抛出这个事件（这只对原生 Promise 有效）
process.on('unhandledRejection', async function (error) {
  console.error('unhandledRejection', error);
  await sendMessage('unhandledRejection', error.message)
  process.exit(1);
});