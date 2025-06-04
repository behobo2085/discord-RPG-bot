const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getPlayerData } = require('./data');

// 獲取職業名稱
function getClassName(classId) {
  const classNames = {
    'warrior': '戰士',
    'mage': '法師',
    'archer': '弓箭手',
    'thief': '盜賊'
  };
  
  return classNames[classId] || classId;
}

// 立即導出getClassName，避免循環依賴
module.exports.getClassName = getClassName;

// 在其他模組導入後再引入其他模組
const { handleStartGame, handleClassSelection } = require('./character');
const { handleHelp } = require('./commands');
const { handleExploreMenu, handleExplore } = require('./exploration');
const { handleShop, handleShopSelection, handleBuyItem } = require('./shopHandler');
const { handleInventory, handleInventoryAction, handleUseItem, handleEquipItem } = require('./inventory');
const { handleStatus } = require('./status');
const { handleBattleAction, handleAttack, handleSkillSelection, handleItemSelection } = require('./battleHandler');
const { handleGuild, handleGuildAction } = require('./guild');
const { createMainMenuButtons } = require('./buttons');

// 顯示主選單
async function showMainMenu(interaction) {
  // 獲取玩家資料
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
  const mainMenuRows = createMainMenuButtons();
  
  await interaction.update({
    embeds: [embed],
    components: mainMenuRows,
    content: ''
  });
}

// 處理按鈕互動
async function handleButtonInteraction(interaction) {
  try {
    const customId = interaction.customId;
    
    // 根據按鈕ID處理不同功能
    if (customId === 'start_game') {
      await handleStartGame(interaction);
    } else if (customId === 'reconnect_game') {
      await handleReconnect(interaction);
    } else if (customId === 'help') {
      await handleHelp(interaction);
    } else if (customId === 'explore_menu') {
      await handleExploreMenu(interaction);
    } else if (customId === 'back_to_main') {
      await showMainMenu(interaction);
    } else if (customId === 'shop') {
      await handleShop(interaction);
    } else if (customId === 'inventory') {
      await handleInventory(interaction);
    } else if (customId === 'status') {
      await handleStatus(interaction);
    } else if (customId === 'guild') {
      await handleGuild(interaction);
    } else if (customId.startsWith('continue_explore_')) {
      // 繼續探索按鈕處理
      const areaId = customId.replace('continue_explore_', '');
      await handleExplore(interaction, areaId);
    } else if (customId.startsWith('guild_')) {
      await handleGuildAction(interaction);
    } else if (customId === 'shop') {
      // 顯示商店主選單
      await handleShop(interaction);
    } else if (customId === 'shop_back') {
      // 返回主選單
      await showMainMenu(interaction);
    } else if (customId.startsWith('shop_')) {
      await handleShopSelection(interaction);
    } else if (customId.startsWith('buy_')) {
      await handleBuyItem(interaction);
    } else if (customId.startsWith('inventory_')) {
      await handleInventoryAction(interaction);
    } else if (customId.startsWith('battle_')) {
      await handleBattleAction(interaction);
    } else if (customId === 'battle_attack') {
      await handleAttack(interaction);
    } else if (customId === 'battle_skill') {
      await handleSkillSelection(interaction);
    } else if (customId === 'battle_item') {
      await handleItemSelection(interaction);
    } else if (customId.startsWith('class_')) {
      await handleClassSelection(interaction);
    }
  } catch (error) {
    console.error('處理按鈕互動時出錯:', error);
    
    // 如果是按鈕已過期的錯誤
    if (error.code === 'InteractionCollectorError') {
      // 創建重新連接按鈕，而非開始遊戲按鈕
      const { createReconnectButton } = require('./buttons');
      const reconnectRow = createReconnectButton();
      
      await interaction.reply({
        content: '⚠️ 這個按鈕已經過期了，請使用這個新按鈕重新連接遊戲。',
        components: [reconnectRow],
        flags: MessageFlags.Ephemeral
      });
    } else {
      // 其他錯誤
      await interaction.reply({
        content: '⚠️ 處理你的請求時出錯了，請稍後再試。',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}

// 處理選單互動
async function handleSelectMenuInteraction(interaction) {
  try {
    const customId = interaction.customId;
    
    if (customId === 'area_select') {
      const areaId = interaction.values[0];
      await handleExplore(interaction, areaId);
    } else if (customId === 'class_select') {
      const classId = interaction.values[0];
      await handleClassSelection(interaction, classId);
    } else if (customId === 'skill_select') {
      await handleSkillSelection(interaction);
    } else if (customId === 'use_item') {
      await handleUseItem(interaction);
    } else if (customId === 'equip_item') {
      await handleEquipItem(interaction);
    } else if (customId === 'battle_item_select') {
      await handleItemSelection(interaction);
    }
  } catch (error) {
    console.error('處理選單互動時出錯:', error);
    
    // 如果是選單已過期的錯誤
    if (error.code === 'InteractionCollectorError') {
      const { createReconnectButton } = require('./buttons');
      const reconnectRow = createReconnectButton();
      
      await interaction.reply({
        content: '⚠️ 這個選單已經過期了，請使用這個新按鈕重新連接遊戲。',
        components: [reconnectRow],
        flags: MessageFlags.Ephemeral
      });
    } else {
      // 其他錯誤
      await interaction.reply({
        content: '⚠️ 處理你的請求時出錯了，請稍後再試。',
        flags: MessageFlags.Ephemeral
      });
    }
  }
}



// 處理重新連接功能
async function handleReconnect(interaction) {
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  if (playerData) {
    // 如果找到玩家資料，顯示主選單
    const { createMainMenuButtons } = require('./buttons');
    const mainMenuRows = createMainMenuButtons();
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🎮 主選單')
      .setDescription(`歡迎回來，${playerData.name}！`)
      .addFields(
        { name: '等級', value: `${playerData.level}`, inline: true },
        { name: '職業', value: getClassName(playerData.class), inline: true },
        { name: '金幣', value: `${playerData.gold}`, inline: true },
        { name: '生命值', value: `${playerData.hp}/${playerData.maxHp}`, inline: true },
        { name: '魔法值', value: `${playerData.mp}/${playerData.maxMp}`, inline: true },
        { name: '經驗值', value: `${playerData.exp}/${playerData.level * 100}`, inline: true }
      );
    
    await interaction.update({
      embeds: [embed],
      components: mainMenuRows,
      content: null
    });
  } else {
    // 如果找不到玩家資料，提示開始新遊戲
    const startButton = new ButtonBuilder()
      .setCustomId('start_game')
      .setLabel('開始遊戲')
      .setStyle(ButtonStyle.Success);
      
    const helpButton = new ButtonBuilder()
      .setCustomId('help')
      .setLabel('遊戲說明')
      .setStyle(ButtonStyle.Secondary);
    
    const row = new ActionRowBuilder()
      .addComponents(startButton, helpButton);
    
    const embed = new EmbedBuilder()
      .setColor(0x0099FF)
      .setTitle('🎮 RPG冒險遊戲')
      .setDescription('找不到你的角色資料，可能已被刪除或從未創建過。')
      .addFields(
        { name: '開始新遊戲', value: '點擊下方按鈕開始一個全新的冒險！' }
      );
    
    await interaction.update({
      embeds: [embed],
      components: [row],
      content: null
    });
  }
}

// 更新模組導出，getClassName已在前面導出
module.exports.handleButtonInteraction = handleButtonInteraction;
module.exports.handleSelectMenuInteraction = handleSelectMenuInteraction;
module.exports.showMainMenu = showMainMenu;
module.exports.handleReconnect = handleReconnect;
