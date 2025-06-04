const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { Player } = require('./player');
const { getPlayerData, setPlayerData } = require('./data');
const { getClassName } = require('./interactions'); // 從interactions引入getClassName
// 移除對showMainMenu的直接引用，避免循環依賴

// 開始遊戲處理
async function handleStartGame(interaction) {
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  // 如果玩家已經有角色，直接顯示主選單
  if (playerData) {
    // 不直接引用showMainMenu，而是使用自定義的返回主選單邏輯
    return await returnToMainMenu(interaction);
  }
  
  // 創建職業選擇選單
  const classSelect = new StringSelectMenuBuilder()
    .setCustomId('class_select')
    .setPlaceholder('選擇你的職業')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('戰士')
        .setValue('warrior')
        .setDescription('高生命值和防禦力，擅長近戰')
        .setEmoji('⚔️'),
      new StringSelectMenuOptionBuilder()
        .setLabel('法師')
        .setValue('mage')
        .setDescription('高魔法攻擊力，擅長遠距離攻擊')
        .setEmoji('🧙'),
      new StringSelectMenuOptionBuilder()
        .setLabel('弓箭手')
        .setValue('archer')
        .setDescription('高敏捷和命中率，擅長遠距離攻擊')
        .setEmoji('🏹')
    );
  
  const row = new ActionRowBuilder()
    .addComponents(classSelect);
  
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('👤 創建角色')
    .setDescription('選擇你的職業來開始冒險！')
    .addFields(
      { name: '戰士 ⚔️', value: '高生命值和防禦力，擅長近戰' },
      { name: '法師 🧙', value: '高魔法攻擊力，擅長遠距離攻擊' },
      { name: '弓箭手 🏹', value: '高敏捷和命中率，擅長遠距離攻擊' }
    );
  
  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

// 處理職業選擇
async function handleClassSelection(interaction, classId = null) {
  const playerId = interaction.user.id;
  
  // 如果是從選單中選擇的職業
  if (!classId && interaction.isStringSelectMenu()) {
    classId = interaction.values[0];
  }
  
  // 如果是從按鈕中選擇的職業
  if (!classId && interaction.isButton()) {
    classId = interaction.customId.replace('class_', '');
  }
  
  // 創建新玩家
  const playerName = interaction.user.username;
  const newPlayer = new Player(playerId, playerName, classId);
  
  // 保存玩家資料
  setPlayerData(playerId, newPlayer);
  
  // 顯示角色創建成功訊息
  const embed = new EmbedBuilder()
    .setColor(0x00FF00)
    .setTitle('✅ 角色創建成功')
    .setDescription(`恭喜你，${playerName}！你已成功創建了一個${getClassName(classId)}角色。`)
    .addFields(
      { name: '等級', value: '1', inline: true },
      { name: '生命值', value: `${newPlayer.hp}/${newPlayer.maxHp}`, inline: true },
      { name: '魔法值', value: `${newPlayer.mp}/${newPlayer.maxMp}`, inline: true },
      { name: '攻擊力', value: `${newPlayer.attack}`, inline: true },
      { name: '防禦力', value: `${newPlayer.defense}`, inline: true },
      { name: '金幣', value: `${newPlayer.gold}`, inline: true }
    )
    .setFooter({ text: '準備好開始你的冒險了嗎？' });
  
  // 創建主選單按鈕
  const { createMainMenuButtons } = require('./buttons');
  const mainMenuRows = createMainMenuButtons();
  
  await interaction.update({
    embeds: [embed],
    components: mainMenuRows
  });
}

// 自定義返回主選單函數，避免循環依賴
async function returnToMainMenu(interaction) {
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  if (!playerData) {
    // 使用重新連接按鈕而不是開始遊戲按鈕
    const { createReconnectButton } = require('./buttons');
    const reconnectRow = createReconnectButton();
    
    await interaction.update({
      content: '你還沒有角色，或者交互已過期。請重新連接！',
      components: [reconnectRow],
      embeds: []
    });
    return;
  }
  
  // 創建主選單嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🎮 RPG 遊戲主選單')
    .setDescription(`歡迎回來，${playerData.name}！選擇下方按鈕來進行遊戲。`)
    .addFields(
      { name: '角色信息', value: `等級: ${playerData.level} | 職業: ${getClassName(playerData.class)}`, inline: false },
      { name: '生命值', value: `${playerData.hp}/${playerData.maxHp}`, inline: true },
      { name: '魔力', value: `${playerData.mp}/${playerData.maxMp}`, inline: true },
      { name: '金幣', value: `${playerData.gold}`, inline: true }
    );
  
  // 創建主選單按鈕
  const { createMainMenuButtons } = require('./buttons');
  const mainMenuRows = createMainMenuButtons();
  
  await interaction.update({
    embeds: [embed],
    components: mainMenuRows,
    content: ''
  });
}

module.exports = {
  handleStartGame,
  handleClassSelection
};
