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
      /*{ type: 'action', action: { type: 'message', label: '🍧菜單', text: '菜單' } },
      { type: 'action', action: { type: 'message', label: '⭐限定', text: '限定品項' } },
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
  if (event.type === 'message' && event.message.type === 'text') {
    const userText = event.message.text;
    let replyMessage;

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
          { type: 'text', text: '我們在這裡！\n南投縣竹山鎮延平新村1-20號\n歡迎來店參訪！' }
        ];
        break;
      case '聯絡電話':
        replyMessage = {
          type: 'text',
          text: '連絡電話：049-2653205\n歡迎來電預約參觀！'
        };
        break;
      /*case '菜單':
        replyMessage = {
          type: 'text',
          text: '🍧 菜單請參考上圖'
        };
        break;*/
      case '更多資訊':
        replyMessage = {
          type: 'text',
          text: '參考下方按鈕以獲得更詳細的資訊！'
        };
        break;
      case '營業時間':
        replyMessage = {
          type: 'text',
          text: '營業時間如上所示，歡迎在營業時間內參訪！'
        };
        break;
      /*case '招牌介紹':
        replyMessage = {
          type: 'template',
          altText: '本季限定品項推薦 (請在手機上查看)',
          template: {
            type: 'carousel',
            columns: [
              {
                thumbnailImageUrl: 'https://scontent.cdninstagram.com/v/t39.30808-6/594832321_1367900191800243_2775791771811882756_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=Mzc4MTYwNDYyMTQyNTY5NjQwMA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE2Mzl4MjA0OC5zZHIuQzMifQ%3D%3D&_nc_ohc=D_maq4b0BgUQ7kNvwEt8kij&_nc_oc=AdmqAZ97y69ceiECphlCvvxVfURys9hMkLKwEy4vZUbgIKsjOdZIRVEFNh1bNnONgyw&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=Djs69YMcSH9gzVGqOEI_IA&oh=00_AfkpOoBs6jLQlVHVFn6amBl5lf1ffaKmbXpoSojwk9GTfw&oe=6945DB68',
                title: '綜合紫米粥',
                text: '暖心甜品，冬季首選',
                actions: [
                  { type: 'uri', label: 'IG 貼文', uri: 'https://www.instagram.com/p/DR69V4NDd6Q/' },
                  { type: 'uri', label: 'FB 粉專', uri: 'https://www.facebook.com/share/p/1FZzNAWhdd/' }
                ]
              },
              {
                thumbnailImageUrl: 'https://scontent.cdninstagram.com/v/t39.30808-6/586531028_1358221596101436_9187067188093452106_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=111&ig_cache_key=Mzc3MjAxOTkzOTU1ODE2NTA0NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE2Mzl4MjA0OC5zZHIuQzMifQ%3D%3D&_nc_ohc=E8U0yUgWhjQQ7kNvwEsOHNW&_nc_oc=AdkAxHO17qfRyg2OWOSh7vOPRCdIGcRfSOZote4eH1Q8tBNBgCHvPK0Pq43_vIlveNM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=Djs69YMcSH9gzVGqOEI_IA&oh=00_Afn4MW5WlQBpSG6NR6HxAOlIBjnW9Sxzj3XX3_SH8kopqA&oe=6945E234',
                title: '奶霜抹茶雪花冰',
                text: '濃郁抹茶搭配綿密奶霜',
                actions: [
                  { type: 'uri', label: 'IG 貼文', uri: 'https://www.instagram.com/p/DRY6CZnDgo0/' },
                  { type: 'uri', label: 'FB 粉專', uri: 'https://www.facebook.com/share/p/16qeEKz3am/' }
                ]
              }
            ]
          }
        };
        break;
      default:
        replyMessage = {
          type: 'text',
          text: '目前還聽不懂這個指令喔 😅\n可以試著點選下方按鈕，或輸入「菜單」、「地址」等關鍵字！'
        };
        break;*/
    }

    if (Array.isArray(replyMessage)) {
      replyMessage[replyMessage.length - 1].quickReply = quickReplyItems;
    } else {
      replyMessage.quickReply = quickReplyItems;
    }

    return client.replyMessage(event.replyToken, replyMessage);
  }

  return Promise.resolve(null);
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

