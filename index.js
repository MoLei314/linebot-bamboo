'use strict';

const line = require('@line/bot-sdk');
const express = require('express');
const axios = require('axios');

// create LINE SDK config from env variables
const config = {
  channelSecret: process.env.CHANNEL_SECRET,
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN
};

// create LINE SDK client
const client = new line.Client(config);
// create Express app
// about Express itself: https://expressjs.com/
const app = express();

app.get('/', (req, res) => {
  res.status(200).send('LINE Bot is running on Render!');
});

// register a webhook handler with middleware
// about the middleware, please refer to doc
app.post('/callback', line.middleware(config), (req, res) => {
  Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
      console.error(err);
      res.status(500).end();
    });
});

// event handler
function handleEvent(event) {
  if (event.type !== 'message' || event.message.type !== 'text') {
    // ignore non-text-message event
    return Promise.resolve(null);
  }
  // 定義 Quick Reply 按鈕 (所有回覆共用)
  const quickReplyItems = {
    items: [
      {
        type: 'action',
        action: { type: 'message', label: '📍地址', text: '地址' }
      },
      {
        type: 'action',
        action: { type: 'message', label: '⏰營業時間', text: '營業時間' }
      },
      {
        type: 'action',
        action: { type: 'message', label: '📞聯絡電話', text: '聯絡電話' }
      },
      /*{
        type: 'action',
        action: { type: 'message', label: '🍧菜單', text: '菜單' }
      },
      {
        type: 'action',
        action: { type: 'message', label: '⭐限定', text: '限定品項' }
      },
      {
        type: 'action',
        action: { type: 'message', label: '招牌介紹', text: '招牌介紹' }
      }*/
    ]
  };

  // ==========================================
  // 情境 1：使用者剛加入好友 (或解除封鎖)
  // ==========================================
  if (event.type === 'follow') {
    const replyMessage = {
      type: 'text',
      text: '你好！歡迎來到璞園藝術坊 🎉\n請點選下方的按鈕，或輸入關鍵字來獲取更多資訊喔！',
      quickReply: quickReplyItems
    };
    return client.replyMessage(event.replyToken, replyMessage);
  }
  // ==========================================
  // 情境 2：處理正常的文字訊息
  // ==========================================
  if (event.type === 'message' && event.message.type === 'text') {
  const userText = event.message.text;
  let replyMessage = {};

  // 根據使用者的文字內容決定回覆訊息
  switch (userText) {
    case '地址':
      replyMessage = [
        {
          type: 'text',
          text: '我們在這裡！'
        },
        {
          type: 'location',
          title: '璞園藝術坊',
          address: '南投縣竹山鎮延平新村1-20號',
          latitude: 23.765590,
          longitude: 120.710719
        },
        {
          type: 'text',
          text: '歡迎來店參訪！'
        }
      ];
      break;
    case '聯絡電話':
      replyMessage = {
        type: 'text',
        text: '連絡電話：049-2653205\n歡迎來電預約參訪！'
      };
      break;
    case '營業時間':
      replyMessage = {
        type: 'text',
        text: '營業時間如上，歡迎來店參訪！'
      };
      break;
    default:
      // 如果不是上述關鍵字，做原本的 Echo 功能 (複誦使用者說的話)
      replyMessage = {
        type: 'text',
        text: '你好！歡迎來到璞園藝術坊，請點選下方的快速回覆按鈕以獲取更多資訊！'
      };
      break;
  }
  }
  // 將 Quick Reply 附加到要回傳的訊息物件中
  // 判斷 replyMessage 是陣列還是單一物件，將 Quick Reply 綁定在最後一則訊息
  if (Array.isArray(replyMessage)) {
    replyMessage[replyMessage.length - 1].quickReply = quickReplyItems;
  } else {
    replyMessage.quickReply = quickReplyItems;
  }
  // 使用 reply API 回傳
  return client.replyMessage(event.replyToken, replyMessage);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);

  // 3. Render 防休眠機制 (Keep-Alive)
  // Render 在運行時會自動注入 RENDER_EXTERNAL_URL 環境變數
  const selfUrl = process.env.RENDER_EXTERNAL_URL; 
  if (selfUrl) {
    console.log(`防休眠機制已啟動，監聽網址: ${selfUrl}`);
    // 設定每 14 分鐘 (14 * 60 * 1000 毫秒) 戳一次自己
    setInterval(async () => {
      try {
        await axios.get(selfUrl);
        console.log(`[Keep-Alive] 成功喚醒: ${new Date().toISOString()}`);
      } catch (error) {
        console.error('[Keep-Alive] 喚醒失敗:', error.message);
      }
    }, 14 * 60 * 1000); 
  }
  });

