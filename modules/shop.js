const { ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, AttachmentBuilder } = require('discord.js');
const { items } = require('./items');
const path = require('path');
const fs = require('fs');

// 商店類別
class Shop {
  constructor(id, name, description, itemIds) {
    this.id = id;
    this.name = name;
    this.description = description;
    this.itemIds = itemIds; // 商店銷售的物品ID列表
  }
  
  // 獲取商店的所有物品
  getItems() {
    return this.itemIds.map(id => items[id]).filter(item => item);
  }
}

// 預定義商店
const shops = {
  'weapon_shop': new Shop(
    'weapon_shop',
    '武器商店',
    '各種武器應有盡有',
    ['sword', 'staff', 'bow']
  ),
  'armor_shop': new Shop(
    'armor_shop',
    '防具商店',
    '高品質防具專賣',
    ['leather_armor', 'robe']
  ),
  'potion_shop': new Shop(
    'potion_shop',
    '藥水商店',
    '各種藥水和消耗品',
    ['hp_potion', 'mp_potion']
  )
};

// 創建商店選擇按鈕
function createShopButtons() {
  const row = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('shop_weapon_shop')
        .setLabel('武器店')
        .setEmoji('⚔️')  // 劍的emoji
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('shop_armor_shop')
        .setLabel('防具店')
        .setEmoji('🛡️')  // 盾牌的emoji
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('shop_potion_shop')
        .setLabel('道具店')
        .setEmoji('🧪')  // 試管的emoji
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('shop_back')
        .setLabel('返回主選單')
        .setEmoji('🏠')  // 房子的emoji
        .setStyle(ButtonStyle.Secondary)
    );
  
  return row;
}

// 創建商店物品列表嵌入訊息
async function createShopEmbed(shopId) {
  const shop = shops[shopId];
  const result = { embed: null, attachment: null };
  
  if (!shop) {
    result.embed = new EmbedBuilder().setDescription('商店不存在');
    return result;
  }
  
  const shopItems = shop.getItems();
  
  const embed = new EmbedBuilder()
    .setTitle(`${shop.name}`)
    .setDescription(`${shop.description}\n\n選擇下方按鈕購買物品：`);
  
  // 添加物品列表
  shopItems.forEach(item => {
    let itemDesc = item.description;
    
    // 如果物品有等級限制，顯示等級限制
    if (item.levelReq && item.levelReq > 1) {
      itemDesc += `\n等級限制: ${item.levelReq} 級`;
    }
    
    // 顯示裝備屬性
    if (item.effects) {
      const effectsText = Object.entries(item.effects)
        .filter(([key, value]) => key !== 'restore') // 排除藥水的恢復效果
        .map(([key, value]) => `${key}: +${value}`)
        .join(', ');
      
      if (effectsText) {
        itemDesc += `\n屬性: ${effectsText}`;
      }
    }
    
    embed.addFields({
      name: `${item.name} - ${item.price} 金幣`,
      value: itemDesc
    });
  });
  
  // 嘗試加載商店圖片
  let attachment = null;
  const imagePath = path.join('d:', 'python', 'RPGBOT', 'rpg_bot', 'image', `${shop.name}.png`);
  
  try {
    if (fs.existsSync(imagePath)) {
      attachment = new AttachmentBuilder(imagePath);
      embed.setImage(`attachment://${path.basename(imagePath)}`);
    } else {
      // 嘗試尋找市集小販商人圖片
      const merchantPath = path.join('d:', 'python', 'RPGBOT', 'rpg_bot', 'image', '市集小販商人.png');
      if (fs.existsSync(merchantPath)) {
        attachment = new AttachmentBuilder(merchantPath);
        embed.setImage(`attachment://${path.basename(merchantPath)}`);
      }
    }
  } catch (error) {
    console.error('加載商店圖片時出錯:', error);
  }
  
  result.embed = embed;
  result.attachment = attachment;
  return result;
}

// 創建購買物品按鈕
function createBuyButtons(shopId) {
  const shop = shops[shopId];
  const rows = [];
  
  // 創建返回按鈕
  const backButton = new ButtonBuilder()
    .setCustomId('shop')
    .setLabel('返回商店列表')
    .setEmoji('🔙')  // 返回箭頭的emoji
    .setStyle(ButtonStyle.Secondary);
  
  if (!shop) {
    // 如果商店不存在，只返回返回按鈕
    const row = new ActionRowBuilder().addComponents(backButton);
    return [row];
  }
  
  const shopItems = shop.getItems();
  
  // 如果商店沒有物品，只返回返回按鈕
  if (shopItems.length === 0) {
    const row = new ActionRowBuilder().addComponents(backButton);
    return [row];
  }
  
  // 為每個物品創建購買按鈕
  const itemButtons = shopItems.map(item => {
    // 根據物品類型設置不同的emoji
    let emoji = '🛒';  // 默認購物車emoji
    if (item.type === 'weapon') emoji = '⚔️';
    else if (item.type === 'armor') emoji = '🛡️';
    else if (item.type === 'potion') emoji = '🧪';
    else if (item.type === 'material') emoji = '🧱';
    
    return new ButtonBuilder()
      .setCustomId(`buy_${item.id}`)
      .setLabel(`購買 ${item.name}`)
      .setEmoji(emoji)
      .setStyle(ButtonStyle.Primary);
  });
  
  // 將按鈕分成多行（每行最多5個按鈕）
  for (let i = 0; i < itemButtons.length; i += 5) {
    const rowButtons = itemButtons.slice(i, i + 5);
    const row = new ActionRowBuilder().addComponents(rowButtons);
    rows.push(row);
  }
  
  // 添加返回按鈕到最後一行
  if (rows.length === 0) {
    rows.push(new ActionRowBuilder().addComponents(backButton));
  } else {
    const lastRow = rows[rows.length - 1];
    if (lastRow.components.length < 5) {
      // 如果最後一行還有空間，添加返回按鈕
      lastRow.addComponents(backButton);
    } else {
      // 否則創建新的一行
      rows.push(new ActionRowBuilder().addComponents(backButton));
    }
  }
  
  return rows;
}

// 購買物品
function buyItem(player, itemId) {
  const item = items[itemId];
  
  if (!item) {
    return { success: false, message: '物品不存在' };
  }
  
  // 檢查玩家等級是否符合要求
  if (item.levelReq && player.level < item.levelReq) {
    return { 
      success: false, 
      message: `無法購買 ${item.name}，需要等級 ${item.levelReq} 才能購買！` 
    };
  }
  
  // 檢查玩家金幣是否足夠
  if (player.gold < item.price) {
    return { success: false, message: '金幣不足' };
  }
  
  // 扣除金幣
  player.gold -= item.price;
  
  // 添加物品到背包
  if (!player.inventory) {
    player.inventory = {};
  }
  
  if (!player.inventory[itemId]) {
    player.inventory[itemId] = 0;
  }
  player.inventory[itemId]++;
  
  return { 
    success: true, 
    message: `成功購買 ${item.name}！剩餘金幣: ${player.gold}`,
    item: item
  };
}

module.exports = { Shop, shops, createShopButtons, createShopEmbed, createBuyButtons, buyItem };