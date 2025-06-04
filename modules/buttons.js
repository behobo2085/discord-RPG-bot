const { ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// 創建主選單按鈕
function createMainMenuButtons() {
  // 第一行按鈕
  const exploreButton = new ButtonBuilder()
    .setCustomId('explore_menu')
    .setLabel('探索')
    .setEmoji('🌍')  // 地球 emoji
    .setStyle(ButtonStyle.Primary);
    
  const shopButton = new ButtonBuilder()
    .setCustomId('shop')
    .setLabel('商店')
    .setEmoji('🏪')  // 便利商店 emoji
    .setStyle(ButtonStyle.Success);
    
  const inventoryButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('背包')
    .setEmoji('🎒')  // 背包 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const statusButton = new ButtonBuilder()
    .setCustomId('status')
    .setLabel('角色狀態')
    .setEmoji('📊')  // 圖表 emoji
    .setStyle(ButtonStyle.Secondary);
  
  const guildButton = new ButtonBuilder()
    .setCustomId('guild')
    .setLabel('冒險者公會')
    .setEmoji('🏛️')  // 古典建築 emoji
    .setStyle(ButtonStyle.Success);
  
  const row1 = new ActionRowBuilder()
    .addComponents(exploreButton, shopButton, inventoryButton, statusButton, guildButton);
  
  // 第二行按鈕 - 農業、採礦、釣魚
  const farmButton = new ButtonBuilder()
    .setCustomId('guild_farm')
    .setLabel('種田')
    .setEmoji('🌾')  // 稻穗 emoji
    .setStyle(ButtonStyle.Primary);
    
  const mineButton = new ButtonBuilder()
    .setCustomId('guild_mine')
    .setLabel('挖礦')
    .setEmoji('⛏️')  // 十字鎬 emoji
    .setStyle(ButtonStyle.Primary);
    
  const fishButton = new ButtonBuilder()
    .setCustomId('guild_fish')
    .setLabel('釣魚')
    .setEmoji('🎣')  // 釣竿 emoji
    .setStyle(ButtonStyle.Primary);
  
  const row2 = new ActionRowBuilder()
    .addComponents(farmButton, mineButton, fishButton);
    
  return [row1, row2];
}

// 創建地圖選擇選單
function createAreaSelectMenu(playerLevel) {
  const { getAllAreas, canEnterArea } = require('./mobs');
  const areas = getAllAreas();
  
  const areaOptions = areas.map(area => {
    const option = new StringSelectMenuOptionBuilder()
      .setLabel(area.name)
      .setValue(area.id)
      .setDescription(`${area.description} (等級 ${area.minLevel}-${area.maxLevel})`)
    
    // 如果玩家等級不足，標記為禁用
    if (!canEnterArea(playerLevel, area.id)) {
      option.setDescription(`需要等級 ${area.minLevel} 才能進入！`)
        .setDefault(false);
      // Discord.js v14中，StringSelectMenuOptionBuilder不支持setDisabled方法
    }
    
    return option;
  });
  
  const areaSelect = new StringSelectMenuBuilder()
    .setCustomId('area_select')
    .setPlaceholder('選擇要探索的地區')
    .addOptions(areaOptions);
    
  const row = new ActionRowBuilder()
    .addComponents(areaSelect);
    
  const backButton = new ButtonBuilder()
    .setCustomId('back_to_main')
    .setLabel('返回主選單')
    .setStyle(ButtonStyle.Secondary);
    
  const backRow = new ActionRowBuilder()
    .addComponents(backButton);
    
  return [row, backRow];
}

// 創建戰鬥按鈕
function createBattleButtons() {
  const attackButton = new ButtonBuilder()
    .setCustomId('battle_attack')
    .setLabel('攻擊')
    .setEmoji('⚔️')  // 交叉的劍 emoji
    .setStyle(ButtonStyle.Danger);
    
  const skillButton = new ButtonBuilder()
    .setCustomId('battle_skill')
    .setLabel('技能')
    .setEmoji('✨')  // 星星 emoji
    .setStyle(ButtonStyle.Primary);
    
  const itemButton = new ButtonBuilder()
    .setCustomId('battle_item')
    .setLabel('使用物品')
    .setEmoji('🧪')  // 試管 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const fleeButton = new ButtonBuilder()
    .setCustomId('battle_flee')
    .setLabel('逃跑')
    .setEmoji('🏃')  // 跑步的人 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const row = new ActionRowBuilder()
    .addComponents(attackButton, skillButton, itemButton, fleeButton);
    
  return row;
}

// 創建商店按鈕
function createShopButtons() {
  const weaponButton = new ButtonBuilder()
    .setCustomId('shop_weapon')
    .setLabel('武器')
    .setEmoji('⚔️')  // 交叉的劍 emoji
    .setStyle(ButtonStyle.Primary);
    
  const armorButton = new ButtonBuilder()
    .setCustomId('shop_armor')
    .setLabel('防具')
    .setEmoji('🛡️')  // 盾牌 emoji
    .setStyle(ButtonStyle.Primary);
    
  const potionButton = new ButtonBuilder()
    .setCustomId('shop_potion')
    .setLabel('藥水')
    .setEmoji('🧪')  // 試管 emoji
    .setStyle(ButtonStyle.Success);
    
  const backButton = new ButtonBuilder()
    .setCustomId('back_to_main')
    .setLabel('返回主選單')
    .setEmoji('🏠')  // 房子 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const row = new ActionRowBuilder()
    .addComponents(weaponButton, armorButton, potionButton, backButton);
    
  return row;
}

// 創建背包按鈕
function createInventoryButtons() {
  const useButton = new ButtonBuilder()
    .setCustomId('inventory_use')
    .setLabel('使用物品')
    .setEmoji('🔄')  // 循環箭頭 emoji
    .setStyle(ButtonStyle.Primary);
    
  const equipButton = new ButtonBuilder()
    .setCustomId('inventory_equip')
    .setLabel('裝備物品')
    .setEmoji('🎽')  // 背心 emoji
    .setStyle(ButtonStyle.Primary);
    
  const backButton = new ButtonBuilder()
    .setCustomId('inventory_back')
    .setLabel('返回主選單')
    .setEmoji('🏠')  // 房子 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const row = new ActionRowBuilder()
    .addComponents(useButton, equipButton, backButton);
    
  return row;
}

// 創建重新連接按鈕
function createReconnectButton() {
  const reconnectButton = new ButtonBuilder()
    .setCustomId('reconnect_game')
    .setLabel('重新連接')
    .setStyle(ButtonStyle.Primary);
    
  const row = new ActionRowBuilder()
    .addComponents(reconnectButton);
    
  return row;
}

// 創建冒險者公會按鈕
function createGuildButtons() {
  const restButton = new ButtonBuilder()
    .setCustomId('guild_rest')
    .setLabel('休息 (30金幣)')
    .setEmoji('💤')  // 睡覺 emoji
    .setStyle(ButtonStyle.Success);
    
  const craftButton = new ButtonBuilder()
    .setCustomId('guild_craft')
    .setLabel('製作裝備')
    .setEmoji('⚒️')  // 錘子和鑿子 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const backButton = new ButtonBuilder()
    .setCustomId('back_to_main')
    .setLabel('返回主選單')
    .setEmoji('🏠')  // 房子 emoji
    .setStyle(ButtonStyle.Secondary);
    
  const row = new ActionRowBuilder()
    .addComponents(restButton, craftButton, backButton);
    
  return [row];
}

// 創建技能選擇選單
function createSkillSelectMenu(playerClass) {
  // 根據職業獲取技能列表
  const skills = getSkillsByClass(playerClass);
  
  const skillOptions = skills.map(skill => {
    return new StringSelectMenuOptionBuilder()
      .setLabel(skill.name)
      .setValue(skill.id)
      .setDescription(`MP消耗: ${skill.mpCost} | 傷害: ${skill.damage || '無'} | 效果: ${skill.effect || '無'}`)
  });
  
  const skillSelect = new StringSelectMenuBuilder()
    .setCustomId('skill_select')
    .setPlaceholder('選擇要使用的技能')
    .addOptions(skillOptions);
    
  const row = new ActionRowBuilder()
    .addComponents(skillSelect);
    
  return row;
}

// 創建物品選擇選單
function createItemSelectMenu(inventory) {
  // 過濾出可在戰鬥中使用的物品（藥水等）
  const usableItems = inventory.filter(item => 
    item.type === 'potion' || item.type === 'scroll' || item.type === 'food');
  
  // 如果沒有可用物品，返回一個提示
  if (usableItems.length === 0) {
    const backButton = new ButtonBuilder()
      .setCustomId('battle_back')
      .setLabel('返回戰鬥')
      .setStyle(ButtonStyle.Secondary);
      
    const row = new ActionRowBuilder()
      .addComponents(backButton);
      
    return row;
  }
  
  const itemOptions = usableItems.map(item => {
    return new StringSelectMenuOptionBuilder()
      .setLabel(item.name)
      .setValue(item.id)
      .setDescription(`效果: ${item.effect || '無'} | 數量: ${item.quantity}`)
  });
  
  const itemSelect = new StringSelectMenuBuilder()
    .setCustomId('battle_item_select')
    .setPlaceholder('選擇要使用的物品')
    .addOptions(itemOptions);
    
  const row = new ActionRowBuilder()
    .addComponents(itemSelect);
    
  return row;
}

// 根據職業獲取技能列表
function getSkillsByClass(playerClass) {
  const skillsByClass = {
    'warrior': [
      { id: 'heavy_slash', name: '重斬', mpCost: 10, damage: '150%', effect: '造成150%物理傷害' },
      { id: 'taunt', name: '挑釁', mpCost: 5, effect: '降低敵人10%攻擊力' },
      { id: 'shield_bash', name: '盾擊', mpCost: 15, damage: '80%', effect: '造成80%物理傷害並暈眩敵人1回合' }
    ],
    'mage': [
      { id: 'fireball', name: '火球術', mpCost: 15, damage: '180%', effect: '造成180%魔法傷害' },
      { id: 'ice_spike', name: '冰刺術', mpCost: 12, damage: '120%', effect: '造成120%魔法傷害並減速敵人' },
      { id: 'lightning', name: '閃電術', mpCost: 20, damage: '200%', effect: '造成200%魔法傷害' }
    ],
    'archer': [
      { id: 'precise_shot', name: '精準射擊', mpCost: 8, damage: '140%', effect: '造成140%物理傷害' },
      { id: 'multi_shot', name: '多重射擊', mpCost: 15, damage: '90% x 3', effect: '發射3箭，每箭造成90%物理傷害' },
      { id: 'poison_arrow', name: '毒箭', mpCost: 12, damage: '80%', effect: '造成80%物理傷害並使敵人中毒' }
    ],
    'thief': [
      { id: 'backstab', name: '背刺', mpCost: 10, damage: '160%', effect: '造成160%物理傷害' },
      { id: 'smoke_bomb', name: '煙霧彈', mpCost: 8, effect: '降低敵人15%命中率' },
      { id: 'assassinate', name: '暗殺', mpCost: 20, damage: '220%', effect: '造成220%物理傷害，有10%機率即死' }
    ]
  };
  
  return skillsByClass[playerClass] || [];
}

module.exports = { 
  createMainMenuButtons, 
  createAreaSelectMenu, 
  createBattleButtons, 
  createShopButtons, 
  createInventoryButtons,
  createGuildButtons,
  createReconnectButton,
  createSkillSelectMenu,
  createItemSelectMenu,
  getSkillsByClass
};