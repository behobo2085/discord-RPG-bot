const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getPlayerData } = require('./data');

// 處理 RPG 指令 - 這是唯一需要的指令，用於開始遊戲
async function handleRpgCommand(interaction) {
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  // 創建嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🎮 RPG冒險遊戲')
    .setDescription('歡迎來到這個奇幻的冒險世界！')
    .addFields(
      { name: '遊戲說明', value: '這是一個Discord上的RPG遊戲，你可以在這裡冒險、戰鬥、升級和收集裝備。' }
    )
    .setFooter({ text: '開始你的冒險吧！' });
  
  // 創建按鈕
  const startButton = new ButtonBuilder()
    .setCustomId('start_game')
    .setLabel('開始遊戲')
    .setStyle(ButtonStyle.Success);
    
  const helpButton = new ButtonBuilder()
    .setCustomId('help')
    .setLabel('遊戲說明')
    .setStyle(ButtonStyle.Secondary);
  
  // 如果玩家已經有角色，則顯示繼續遊戲按鈕
  if (playerData) {
    startButton
      .setCustomId('reconnect_game')
      .setLabel('繼續遊戲');
      
    embed.addFields(
      { name: '你的角色', value: `${playerData.name} (${getClassName(playerData.class)}) - 等級 ${playerData.level}` }
    );
  }
  
  const row = new ActionRowBuilder()
    .addComponents(startButton, helpButton);
  
  await interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

// 獲取職業中文名稱
function getClassName(classId) {
  switch (classId) {
    case 'warrior':
      return '戰士';
    case 'mage':
      return '法師';
    case 'archer':
      return '弓箭手';
    default:
      return '未知職業';
  }
}

// 處理遊戲說明
async function handleHelp(interaction) {
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🎮 RPG遊戲說明')
    .setDescription('這是一個簡單的Discord RPG遊戲，以下是基本操作說明：')
    .addFields(
      { name: '開始遊戲', value: '點擊「開始遊戲」按鈕創建角色' },
      { name: '探索', value: '在主選單中選擇「探索」進入不同的地圖冒險' },
      { name: '戰鬥', value: '在探索中遇到怪物時可以選擇攻擊、使用技能或物品' },
      { name: '商店', value: '在主選單中選擇「商店」購買裝備和物品' },
      { name: '背包', value: '在主選單中選擇「背包」查看和使用你的物品' },
      { name: '角色狀態', value: '在主選單中選擇「角色狀態」查看你的角色屬性' },
      { name: '冒險者公會', value: '在主選單中選擇「冒險者公會」進行休息和生產活動' }
    )
    .setFooter({ text: '祝你遊戲愉快！' });
  
  const backButton = new ButtonBuilder()
    .setCustomId('start_game')
    .setLabel('返回')
    .setStyle(ButtonStyle.Secondary);
  
  const row = new ActionRowBuilder()
    .addComponents(backButton);
  
  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

module.exports = {
  handleRpgCommand,
  handleHelp,
  getClassName
};
