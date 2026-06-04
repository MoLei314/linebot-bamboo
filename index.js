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
      {
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
      }
    ]
  };
  const userText = event.message.text;
  let replyMessage = {};

  // 根據使用者的文字內容決定回覆訊息
  switch (userText) {
    case '地址':
      replyMessage = {
        type: 'location',
        title: '23度半雪花冰舖',
        address: '嘉義縣民雄鄉建國路二段415號',
        latitude: 23.55442,
        longitude: 120.43379
      };
      break;
    case '聯絡電話':
      replyMessage = {
        type: 'text',
        text: '連絡電話：0921290135\n歡迎來電訂購！'
      };
      break;
    case '菜單':
      replyMessage = {
        type: 'text',
        text: '🍧 菜單請參考上圖'
      };
      break;
    case '限定品項':
      replyMessage = {
        type: 'text',
        text: '限定品項請參考上圖'
      };
      break;
    case '營業時間':
      replyMessage = {
        type: 'text',
        text: '營業時間如下'
      };
      break;
    case '招牌介紹':
      replyMessage = {
        type: 'template',
        altText: '本季限定品項推薦 (請在手機上查看)', // 電腦版或通知中心顯示的替代文字
        template: {
          type: 'carousel',
          columns: [
            // 第一張卡片：綜合紫米粥
            {
              thumbnailImageUrl: 'https://scontent.cdninstagram.com/v/t39.30808-6/594832321_1367900191800243_2775791771811882756_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=101&ig_cache_key=Mzc4MTYwNDYyMTQyNTY5NjQwMA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE2Mzl4MjA0OC5zZHIuQzMifQ%3D%3D&_nc_ohc=D_maq4b0BgUQ7kNvwEt8kij&_nc_oc=AdmqAZ97y69ceiECphlCvvxVfURys9hMkLKwEy4vZUbgIKsjOdZIRVEFNh1bNnONgyw&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=Djs69YMcSH9gzVGqOEI_IA&oh=00_AfkpOoBs6jLQlVHVFn6amBl5lf1ffaKmbXpoSojwk9GTfw&oe=6945DB68',
              title: '綜合紫米粥',
              text: '暖心甜品，冬季首選',
              actions: [
                {
                  type: 'uri',
                  label: 'IG 貼文',
                  uri: 'https://www.instagram.com/p/DR69V4NDd6Q/'
                },
                {
                  type: 'uri',
                  label: 'FB 粉專',
                  uri: 'https://www.facebook.com/share/p/1FZzNAWhdd/'
                }
              ]
            },
            // 第二張卡片：奶霜抹茶雪花冰
            {
              thumbnailImageUrl: 'https://scontent.cdninstagram.com/v/t39.30808-6/586531028_1358221596101436_9187067188093452106_n.jpg?stp=dst-jpg_e35_tt6&_nc_cat=111&ig_cache_key=Mzc3MjAxOTkzOTU1ODE2NTA0NA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE2Mzl4MjA0OC5zZHIuQzMifQ%3D%3D&_nc_ohc=E8U0yUgWhjQQ7kNvwEsOHNW&_nc_oc=AdkAxHO17qfRyg2OWOSh7vOPRCdIGcRfSOZote4eH1Q8tBNBgCHvPK0Pq43_vIlveNM&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=Djs69YMcSH9gzVGqOEI_IA&oh=00_Afn4MW5WlQBpSG6NR6HxAOlIBjnW9Sxzj3XX3_SH8kopqA&oe=6945E234',
              title: '奶霜抹茶雪花冰',
              text: '濃郁抹茶搭配綿密奶霜',
              actions: [
                {
                  type: 'uri',
                  label: 'IG 貼文',
                  uri: 'https://www.instagram.com/p/DRY6CZnDgo0/'
                },
                {
                  type: 'uri',
                  label: 'FB 粉專',
                  uri: 'https://www.facebook.com/share/p/16qeEKz3am/'
                }
              ]
            },
            // 第三張卡片：不哭不哭
            {
              thumbnailImageUrl: 'https://scontent.cdninstagram.com/v/t39.30808-6/584964151_1355254819731447_4737314392517631436_n.jpg?stp=dst-jpg_e35_p1080x1080_tt6&_nc_cat=104&ig_cache_key=Mzc2OTc3Nzk5NDM2MjQ4NzE5MA%3D%3D.3-ccb7-5&ccb=7-5&_nc_sid=58cdad&efg=eyJ2ZW5jb2RlX3RhZyI6InhwaWRzLjE2Mzl4MjA0OC5zZHIuQzMifQ%3D%3D&_nc_ohc=AKiZplcB8_oQ7kNvwGCBczz&_nc_oc=Adng_IKK6Ex_RAeKS10Dh94jGTJS4-Zt-F0iKuSbuJh8PMnXUmZiTc8ZpBbRHgdjn7c&_nc_ad=z-m&_nc_cid=0&_nc_zt=23&_nc_ht=scontent.cdninstagram.com&_nc_gid=Djs69YMcSH9gzVGqOEI_IA&oh=00_AfmBhmDDyW61SgreXp_Aitlwge6Qcn1ufxiFK8WqEQAwVA&oe=6945D3E6',
              title: '不哭不哭',
              text: '超可愛造型，療癒你的心',
              actions: [
                {
                  type: 'uri',
                  label: 'IG 貼文',
                  uri: 'https://www.instagram.com/p/DRQ8RzcD4GW/'
                },
                {
                  type: 'uri',
                  label: 'FB 粉專',
                  uri: 'https://www.facebook.com/share/p/1BtRxS84mn/'
                }
              ]
            }
          ]
        }
      };
      break;
    default:
      // 如果不是上述關鍵字，做原本的 Echo 功能 (複誦使用者說的話)
      replyMessage = {
        type: 'text',
        text: event.message.text
      };
      break;
  }
  // 將 Quick Reply 附加到要回傳的訊息物件中
  replyMessage.quickReply = quickReplyItems;
  // 使用 reply API 回傳
  return client.replyMessage(event.replyToken, replyMessage);
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
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
});

