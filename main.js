const { Client, Collection, ActivityType, GatewayIntentBits } = require('discord.js');
const config = require('./config.json');
const fs = require('fs');
const path = require('path');

// 引入模組
const { loadPlayerData, savePlayerData, getPlayerData, setPlayerData } = require('./modules/data');
const { handleRpgCommand, handleHelp } = require('./modules/commands');
const { handleButtonInteraction, handleSelectMenuInteraction, showMainMenu, handleReconnect } = require('./modules/interactions');
const { handleStartGame, handleClassSelection } = require('./modules/character');
const { handleStatus } = require('./modules/status');
const { handleExploreMenu, handleExplore } = require('./modules/exploration');
const { handleBattleAction, handleAttack, handleSkillSelection, handleItemSelection } = require('./modules/battleHandler');
const { handleInventory, handleInventoryAction, handleUseItem, handleEquipItem } = require('./modules/inventory');
const { handleShop, handleShopSelection, handleBuyItem } = require('./modules/shopHandler');
const { handleGuild, handleGuildAction } = require('./modules/guild');

// 創建Discord客戶端
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 全局玩家數據對象
global.players = {};

// 當機器人準備就緒時
client.on('ready', () => {
  console.log(`已登入為 ${client.user.tag}!`);
  
  // 設置機器人狀態
  client.user.setActivity('RPG冒險', { type: ActivityType.Playing });
  
  // 載入玩家資料
  loadPlayerData();
  
  // 註冊斜線指令
  const commands = [
    {
      name: 'rpg',
      description: '開始RPG遊戲'
    }
  ];
  
  client.application.commands.set(commands);
  console.log('已註冊斜線指令！');
  
  // 定時保存玩家資料
  setInterval(() => {
    savePlayerData();
    console.log('已自動保存玩家資料！');
  }, 5 * 60 * 1000); // 每5分鐘保存一次
});

// 處理指令互動
client.on('interactionCreate', async interaction => {
  // 處理斜線指令
  if (interaction.isChatInputCommand()) {
    const { commandName } = interaction;
    
    if (commandName === 'rpg') {
      await handleRpgCommand(interaction);
    }
    
    return;
  }
  
  // 處理按鈕點擊
  if (interaction.isButton()) {
    await handleButtonInteraction(interaction);
    return;
  }
  
  // 處理選單選擇
  if (interaction.isStringSelectMenu()) {
    await handleSelectMenuInteraction(interaction);
    return;
  }
});

// 定期保存玩家資料
setInterval(savePlayerData, 5 * 60 * 1000); // 每5分鐘保存一次

// 登入機器人
client.login(config.token);

// 處理程序關閉時保存資料
process.on('SIGINT', () => {
  console.log('正在關閉機器人...');
  savePlayerData();
  process.exit(0);
});
