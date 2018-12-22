const {
  FileBox
} = require('file-box')
const {
  Wechaty
} = require('wechaty')
const CronJob = require('cron').CronJob
const puppeteer = require('puppeteer')
const devices = require('puppeteer/DeviceDescriptors')
const iPhonex = devices['iPhone X']
const user2 = {
  alias: '小<img class="emoji emoji1f424" text="_web" src="/zh_CN/htmledition/v2/images/spacer.gif" />崽'
}

let omallTop = {
  beautyPage: {
    matchMsg: ' 美护',
    imgUrl: 'beauty.jpeg'
  },
  healthPage: {
    matchMsg: ' 保健',
    imgUrl: 'health.jpeg'
  },
  babyPage: {
    matchMsg: ' 母婴',
    imgUrl: 'baby.jpeg'
  },
  morePage: {
    matchMsg: ' 综合',
    imgUrl: 'more.jpeg'
  },
  hotSalesPage: {
    matchMsg: ' 每日',
    imgUrl: 'hotSales.jpeg'
  },
  pageUrl: 'https://m.msyc.cc/wx/actapp/hotsale/index.html?id=21&tmn=312954'
};
(async function () {
  cornHandler() //启动定时器任务

  const bot = new Wechaty({
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
      user2.contact = await bot.Contact.find({
        alias: user2.alias
      })
      console.log(`User ${user} logined`)
    })
    .on('message', async message => {
      // const room = await bot.Room.find('订单组')
      if (message.to().id === 'filehelper') {
        // await room.say(fileBox)
        messageHandler(message)
      } else if (await message.from().alias() === user2.alias) {
        messageHandler(message, user2)
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
async function messageHandler(message, user2) {
  let page = omallTop[Object.keys(omallTop).find(obj => omallTop[obj].matchMsg === message.text())]
  if (page) {
    getPic(page.imgUrl, message.text())
    message[user2 ? 'from' : 'to']().say(FileBox.fromFile(page.imgUrl))
    message[user2 ? 'from' : 'to']().say(omallTop.pageUrl)
  } else if (message.text() === ' 帮助') {
    const helpInfo = Object.values(omallTop).reduce((x, y) => {
      return x + (y.matchMsg || '')
    }, '')
    message[user2 ? 'from' : 'to']().say(`帮助：${helpInfo}`)
  } else {
    return
  }
}

async function getPic(path, text) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  await page.emulate(iPhonex)
  await page.goto(omallTop.pageUrl, {
    waitUntil: 'networkidle0'
  }) //跳转
  const appNavArr = Array.from(await page.$$('.app-nav a'));
  console.log(appNavArr[0].innerText)
  
  await page.screenshot({
    path,
    type: 'jpeg',
    clip: {
      x: 0,
      y: 290,
      width: 375.2,
      height: 1340 //1340
    }
  })
  await browser.close()
}