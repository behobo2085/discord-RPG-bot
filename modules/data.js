const fs = require('fs');
const path = require('path');

// 載入玩家資料函數
function loadPlayerData() {
  try {
    if (fs.existsSync('./data/players.json')) {
      const data = fs.readFileSync('./data/players.json', 'utf8');
      global.players = JSON.parse(data);
      console.log('已載入玩家資料');
    } else {
      console.log('找不到玩家資料文件，創建新的玩家資料');
      global.players = {};
      // 確保data目錄存在
      if (!fs.existsSync('./data')) {
        fs.mkdirSync('./data', { recursive: true });
      }
      savePlayerData();
    }
  } catch (error) {
    console.error('載入玩家資料時出錯:', error);
    global.players = {};
  }
}

// 保存玩家資料函數
function savePlayerData() {
  try {
    // 確保data目錄存在
    if (!fs.existsSync('./data')) {
      fs.mkdirSync('./data', { recursive: true });
    }
    fs.writeFileSync('./data/players.json', JSON.stringify(global.players, null, 2));
    console.log('已保存玩家資料');
  } catch (error) {
    console.error('保存玩家資料時出錯:', error);
  }
}

// 獲取玩家資料
function getPlayerData(playerId) {
  return global.players[playerId];
}

// 設置玩家資料
function setPlayerData(playerId, data) {
  global.players[playerId] = data;
}

// 刪除玩家資料
function deletePlayerData(playerId) {
  delete global.players[playerId];
}

module.exports = {
  loadPlayerData,
  savePlayerData,
  getPlayerData,
  setPlayerData,
  deletePlayerData
};
