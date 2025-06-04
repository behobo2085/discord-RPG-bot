const { EmbedBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } = require('discord.js');
const { getPlayerData, setPlayerData } = require('./data');
const path = require('path');

// 顯示地圖選擇選單
async function handleExploreMenu(interaction) {
  // 獲取玩家資料
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  if (!playerData) {
    // 使用重新連接按鈕而不是開始遊戲按鈕
    const { createReconnectButton } = require('./buttons');
    const reconnectRow = createReconnectButton();
    
    await interaction.update({
      content: '你還沒有角色，或者交互已過期。請重新連接！',
      components: [reconnectRow]
    });
    return;
  }
  
  // 創建地圖選擇選單
  const { createAreaSelectMenu } = require('./buttons');
  const areaMenuComponents = createAreaSelectMenu(playerData.level);
  
  // 創建嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🗺️ 選擇探索地區')
    .setDescription('選擇你想要探索的地區：')
    .addFields(
      { name: '提示', value: '不同地區有不同等級的怪物和獎勵。' }
    );
  
  await interaction.update({
    embeds: [embed],
    components: areaMenuComponents
  });
}

// 處理探索功能
async function handleExplore(interaction, areaId = null) {
  // 獲取玩家資料
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  if (!playerData) {
    // 使用重新連接按鈕而不是開始遊戲按鈕
    const { createReconnectButton } = require('./buttons');
    const reconnectRow = createReconnectButton();
    
    await interaction.update({
      content: '你還沒有角色，或者交互已過期。請重新連接！',
      components: [reconnectRow]
    });
    return;
  }
  
  // 獲取地區資訊
  const { getAreaById, generateMonster } = require('./mobs');
  const area = getAreaById(areaId);
  
  if (!area) {
    await interaction.update({
      content: '找不到該地區，請重新選擇。',
      components: []
    });
    return;
  }
  
  // 檢查玩家等級是否足夠
  const { canEnterArea } = require('./mobs');
  if (!canEnterArea(playerData.level, areaId)) {
    // 創建返回探索選單按鈕
    const exploreMenuButton = new ButtonBuilder()
      .setCustomId('explore_menu')
      .setLabel('返回探索選單')
      .setStyle(ButtonStyle.Secondary);
    
    const mainMenuButton = new ButtonBuilder()
      .setCustomId('back_to_main')
      .setLabel('返回主選單')
      .setStyle(ButtonStyle.Primary);
    
    const row = new ActionRowBuilder()
      .addComponents(exploreMenuButton, mainMenuButton);
    
    await interaction.update({
      content: `你的等級不足以進入${area.name}！需要等級 ${area.minLevel} 才能進入。`,
      components: [row]
    });
    
    return;
  }
  
  // 隨機決定是否遇到怪物
  const encounterChance = 0.8; // 80%機率遇到怪物
  
  if (Math.random() < encounterChance) {
    // 遇到怪物，開始戰鬥
    const mob = generateMonster(playerData.level, areaId);
    
    // 設置當前戰鬥狀態
    playerData.inBattle = true;
    playerData.currentEnemy = {
      name: mob.name,
      level: mob.level,
      hp: mob.hp,
      maxHp: mob.hp,
      attack: mob.attack,
      defense: mob.defense,
      expReward: mob.expReward,
      goldReward: mob.goldReward,
      imagePath: mob.imagePath,
      area: area.name
    };
    playerData.currentArea = areaId;
    
    // 保存玩家資料
    setPlayerData(playerId, playerData);
    
    // 創建戰鬥嵌入訊息
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle(`⚔️ 遇到了 ${mob.name}！`)
      .setDescription(`在${area.name}的探索中，你遇到了一隻${mob.name}！`)
      .addFields(
        { name: '等級', value: `${mob.level}`, inline: true },
        { name: '生命值', value: `${mob.hp}/${mob.hp}`, inline: true },
        { name: '攻擊力', value: `${mob.attack}`, inline: true },
        { name: '防禦力', value: `${mob.defense}`, inline: true },
        { name: '經驗獎勵', value: `${mob.expReward}`, inline: true },
        { name: '金幣獎勵', value: `${mob.goldReward}`, inline: true }
      );
    
    // 如果有怪物圖片，添加到嵌入訊息
    let files = [];
    if (mob.imagePath && require('fs').existsSync(mob.imagePath)) {
      const attachment = new AttachmentBuilder(mob.imagePath);
      embed.setImage(`attachment://${path.basename(mob.imagePath)}`);
      files = [attachment];
    }
    
    // 創建戰鬥按鈕
    const { createBattleButtons } = require('./buttons');
    const battleRow = createBattleButtons();
    
    await interaction.update({
      embeds: [embed],
      components: [battleRow],
      files: files
    });
  } else {
    // 沒遇到怪物，獲得一些資源
    const resources = ['金幣', '藥草', '木材'];
    const resource = resources[Math.floor(Math.random() * resources.length)];
    let amount = Math.floor(Math.random() * 5) + 1;
    
    let message = '';
    
    // 根據資源類型給予獎勵
    if (resource === '金幣') {
      playerData.gold += amount;
      message = `你在${area.name}探索時發現了${amount}枚金幣！`;
    } else if (resource === '藥草') {
      if (!playerData.resources) playerData.resources = {};
      if (!playerData.resources.herbs) playerData.resources.herbs = 0;
      playerData.resources.herbs += amount;
      message = `你在${area.name}探索時採集到了${amount}株藥草！`;
    } else if (resource === '木材') {
      if (!playerData.resources) playerData.resources = {};
      if (!playerData.resources.wood) playerData.resources.wood = 0;
      playerData.resources.wood += amount;
      message = `你在${area.name}探索時收集到了${amount}個木材！`;
    }
    
    // 保存玩家資料
    setPlayerData(playerId, playerData);
    
    // 創建嵌入訊息
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('🔍 探索發現')
      .setDescription(message)
      .addFields(
        { name: '地區', value: area.name, inline: true },
        { name: '獲得', value: `${amount} ${resource}`, inline: true }
      );
    
    // 創建返回按鈕
    const { createMainMenuButtons } = require('./buttons');
    const mainMenuRow = createMainMenuButtons();
    
    await interaction.update({
      embeds: [embed],
      components: [mainMenuRow]
    });
  }
}

module.exports = {
  handleExploreMenu,
  handleExplore
};
