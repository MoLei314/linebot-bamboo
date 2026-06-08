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
// 核心事件處理器
function handleEvent(event) {
  // 1. 必須「先」定義共用的 Quick Reply 按鈕，後面的程式碼才抓得到它！
  const quickReplyItems = {
    items: [
      { type: 'action', action: { type: 'message', label: '📍地址', text: '地址' } },
      { type: 'action', action: { type: 'message', label: '⏰營業時間', text: '營業時間' } },
      { type: 'action', action: { type: 'message', label: '📞聯絡電話', text: '聯絡電話' } },
      { type: 'action', action: { type: 'message', label: '🎋客製化產品', text: '如何客製化產品？' } },
      /*{ type: 'action', action: { type: 'message', label: '⭐限定', text: '限定品項' } },
      { type: 'action', action: { type: 'message', label: '招牌介紹', text: '招牌介紹' } }*/
    ]
  };

  // 2. 情境：使用者剛加入好友 (或解除封鎖)
  if (event.type === 'follow') {
    return new Promise((resolve) => {
      // 延遲 2 秒 (2000 毫秒)
      setTimeout(() => {
        const replyMessage = {
          type: 'text',
          text: '👇 可以點擊下方按鈕或圖文選單以獲取更多資訊', 
          quickReply: quickReplyItems
        };
        
        client.replyMessage(event.replyToken, replyMessage)
          .then(() => resolve(null))
          .catch((err) => {
            console.error('延遲傳送發生錯誤:', err.originalError.response.data || err.message);
            resolve(null);
          });
      }, 1200); 
    });
  }

  // 3. 情境：處理正常的文字訊息
// 3. 情境：處理正常的文字訊息
  if (event.type === 'message' && event.message.type === 'text') {
    const userText = event.message.text;
    let replyMessage;
    let delayTime = 0; // 🌟 新增：預設不延遲 (0 毫秒)

    switch (userText) {
      case '地址':
        replyMessage = [
          {
            type: 'location',
            title: '璞園藝術坊',
            address: '南投縣竹山鎮延平新村1-20號',
            latitude: 23.765590,
            longitude: 120.710719
          },
          { type: 'text', text: '我們在這裡❗\n\n南投縣竹山鎮延平新村1-20號\n\n歡迎來店參訪❗' }
        ];
        break;
      case '聯絡電話':
        replyMessage = {
          type: 'text',
          text: '市話：049-2653205\n手機：0911-987017\n歡迎來電預約參觀'
        };
        break;
      case '更多資訊':
        replyMessage = {
          type: 'text',
          text: '參考下方按鈕以獲得更詳細的資訊❗'
        };
        break;
      
      // ==========================================
      // 需要延遲的特例區塊
      // ==========================================
      case '營業時間':
        replyMessage = {
          type: 'text',
          text: '歡迎在營業時間內參訪或提前預約❗'
        };
        delayTime = 700; // 🌟 設定專屬的延遲時間：1.2 秒
        break;
      // ==========================================

      case '如何客製化產品？':
        replyMessage = {
          type: 'text',
          text: '若有客製化產品需求\n歡迎直接傳訊息至此官方帳號詢問\n將有負責人員與您聯絡，討論客製化產品的細節🛠️\n什麼產品都能根據需求客製化❗'
        };
        break;
    }

    // 🛡️ 安全防護機制
    if (!replyMessage) {
      return Promise.resolve(null);
    }

    // 統一將 Quick Reply 附加到最後一則訊息
    if (Array.isArray(replyMessage)) {
      replyMessage[replyMessage.length - 1].quickReply = quickReplyItems;
    } else {
      replyMessage.quickReply = quickReplyItems;
    }

    // 🌟 最後的發送階段：判斷是否需要延遲
    if (delayTime > 0) {
      // 如果 delayTime 大於 0，就包裝成 Promise 等待
      return new Promise((resolve) => {
        setTimeout(() => {
          client.replyMessage(event.replyToken, replyMessage)
            .then(() => resolve(null))
            .catch((err) => {
              console.error('文字訊息延遲傳送發生錯誤:', err);
              resolve(null);
            });
        }, delayTime);
      });
    } else {
      // 如果沒有設定延遲 (delayTime 為 0)，就直接秒回
      return client.replyMessage(event.replyToken, replyMessage);
    }
  }
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

