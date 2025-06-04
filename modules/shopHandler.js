const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerData, setPlayerData } = require('./data');
const { shops, createShopButtons, createShopEmbed, createBuyButtons, buyItem } = require('./shop');

// 處理商店功能
async function handleShop(interaction) {
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
  
  // 創建商店嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle('🛒 商店')
    .setDescription('選擇你想要訪問的商店：')
    .addFields(
      { name: '武器店', value: '購買各種武器', inline: true },
      { name: '防具店', value: '購買各種防具', inline: true },
      { name: '道具店', value: '購買各種消耗品和道具', inline: true },
      { name: '金幣', value: `你擁有 ${playerData.gold} 金幣`, inline: false }
    );
  
  // 創建商店選擇按鈕
  const shopButtons = createShopButtons();
  
  await interaction.update({
    embeds: [embed],
    components: [shopButtons],
    content: ''
  });
}

// 處理商店選擇
async function handleShopSelection(interaction) {
  try {
    // 延遲更新，防止交互過期
    await interaction.deferUpdate();
    
    // 獲取選擇的商店ID
    const customId = interaction.customId;
    let shopId = '';
    
    // 檢查是否是商店按鈕（shop_開頭）
    if (customId.startsWith('shop_')) {
      shopId = customId.replace('shop_', '');
    } else {
      // 如果不是商店按鈕，顯示錯誤
      await interaction.editReply({
        content: '❌ 無效的商店按鈕',
        components: []
      });
      return;
    }
    
    // 獲取玩家資料
    const playerId = interaction.user.id;
    const playerData = getPlayerData(playerId);
    
    if (!playerData) {
      // 使用重新連接按鈕而不是開始遊戲按鈕
      const { createReconnectButton } = require('./buttons');
      const reconnectRow = createReconnectButton();
      
      await interaction.editReply({
        content: '你還沒有角色，或者交互已過期。請重新連接！',
        components: [reconnectRow]
      });
      return;
    }
    
    // 檢查商店是否存在
    const shop = shops[shopId];
    if (!shop) {
      const backButton = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('shop_back')
            .setLabel('返回主選單')
            .setStyle(ButtonStyle.Secondary)
        );
      
      await interaction.editReply({
        content: '❌ 商店不存在',
        components: [backButton],
        embeds: []
      });
      return;
    }
    
    // 創建商店物品列表嵌入訊息
    const { embed, attachment } = await createShopEmbed(shopId);
    
    if (!embed) {
      throw new Error('無法創建商店訊息');
    }
    
    // 添加玩家金幣信息
    embed.addFields({ name: '💰 金幣', value: `你擁有 **${playerData.gold}** 金幣`, inline: false });
    
    // 創建購買按鈕
    const buyButtons = createBuyButtons(shopId);
    
    const updateOptions = {
      embeds: [embed],
      components: buyButtons
    };
    
    // 如果有附件（商店圖片），添加附件
    if (attachment) {
      updateOptions.files = [attachment];
    }
    
    await interaction.editReply(updateOptions);
  } catch (error) {
    console.error('處理商店選擇時出錯:', error);
    const backButton = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('shop_back')
          .setLabel('返回主選單')
          .setStyle(ButtonStyle.Secondary)
      );
    
    try {
      await interaction.editReply({
        content: '❌ 載入商店時發生錯誤',
        components: [backButton],
        embeds: []
      });
    } catch (err) {
      console.error('更新訊息時出錯:', err);
    }
  }
}

// 處理購買物品
async function handleBuyItem(interaction) {
  // 獲取選擇的物品ID
  const itemId = interaction.customId.replace('buy_', '');
  
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
  
  // 購買物品
  const result = buyItem(playerData, itemId);
  
  if (result.success) {
    // 保存玩家資料
    setPlayerData(playerId, playerData);
    
    // 創建成功嵌入訊息
    const embed = new EmbedBuilder()
      .setColor(0x00FF00)
      .setTitle('✅ 購買成功')
      .setDescription(`你成功購買了 ${result.item.name}！`)
      .addFields(
        { name: '花費', value: `${result.item.price} 金幣`, inline: true },
        { name: '剩餘金幣', value: `${playerData.gold} 金幣`, inline: true }
      );
    
    if (result.item.description) {
      embed.addFields({ name: '描述', value: result.item.description, inline: false });
    }
    
    if (result.item.stats) {
      const statsText = Object.entries(result.item.stats)
        .map(([key, value]) => `${key}: ${value}`)
        .join(', ');
      
      embed.addFields({ name: '屬性', value: statsText, inline: false });
    }
    
    // 創建返回按鈕
    const { createMainMenuButtons } = require('./buttons');
    const mainMenuRow = createMainMenuButtons();
    
    await interaction.update({
      embeds: [embed],
      components: [mainMenuRow]
    });
  } else {
    // 創建失敗嵌入訊息
    const embed = new EmbedBuilder()
      .setColor(0xFF0000)
      .setTitle('❌ 購買失敗')
      .setDescription(result.message)
      .addFields(
        { name: '金幣', value: `你擁有 ${playerData.gold} 金幣`, inline: true }
      );
    
    // 創建返回商店按鈕
    const backButton = new ButtonBuilder()
      .setCustomId('shop')
      .setLabel('返回商店')
      .setStyle(ButtonStyle.Secondary);
      
    const row = new ActionRowBuilder()
      .addComponents(backButton);
    
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  }
}

module.exports = {
  handleShop,
  handleShopSelection,
  handleBuyItem
};
