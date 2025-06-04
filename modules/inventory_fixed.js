const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');
const { getPlayerData, setPlayerData } = require('./data');
const { items } = require('./items');

// 顯示「沒有物品」的訊息，並提供返回背包按鈕
async function showNoItemMessage(interaction, message) {
  // 創建返回背包按鈕
  const backButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('返回背包')
    .setStyle(ButtonStyle.Secondary);
  
  const buttonRow = new ActionRowBuilder().addComponents(backButton);
  
  await interaction.update({
    content: message,
    components: [buttonRow],
    embeds: []
  });
}

// 處理背包功能
async function handleInventory(interaction) {
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
  
  // 創建背包嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x8B4513)
    .setTitle('🎒 背包')
    .setDescription(`${playerData.name}的背包`);
  
  // 添加裝備信息
  const equipmentFields = [];
  
  if (playerData.equipment) {
    if (playerData.equipment.weapon) {
      const weaponItem = items[playerData.equipment.weapon];
      equipmentFields.push({ name: '武器', value: weaponItem ? weaponItem.name : '無', inline: true });
    } else {
      equipmentFields.push({ name: '武器', value: '無', inline: true });
    }
    
    if (playerData.equipment.armor) {
      const armorItem = items[playerData.equipment.armor];
      equipmentFields.push({ name: '防具', value: armorItem ? armorItem.name : '無', inline: true });
    } else {
      equipmentFields.push({ name: '防具', value: '無', inline: true });
    }
    
    if (playerData.equipment.accessory) {
      const accessoryItem = items[playerData.equipment.accessory];
      equipmentFields.push({ name: '飾品', value: accessoryItem ? accessoryItem.name : '無', inline: true });
    } else {
      equipmentFields.push({ name: '飾品', value: '無', inline: true });
    }
  } else {
    equipmentFields.push({ name: '武器', value: '無', inline: true });
    equipmentFields.push({ name: '防具', value: '無', inline: true });
    equipmentFields.push({ name: '飾品', value: '無', inline: true });
  }
  
  embed.addFields({ name: '當前裝備', value: '以下是你當前的裝備', inline: false });
  if (equipmentFields.length > 0) {
    embed.addFields(...equipmentFields);
  }
  
  // 添加物品信息
  const inventoryFields = [];
  
  if (playerData.inventory && Object.keys(playerData.inventory).length > 0) {
    // 遍歷所有物品ID和數量
    for (const [itemId, quantity] of Object.entries(playerData.inventory)) {
      if (quantity > 0) {
        const item = items[itemId];
        if (item) {
          let itemDesc = item.description || '無描述';
          
          // 顯示等級限制
          if (item.levelReq && item.levelReq > 1) {
            itemDesc += `\n等級限制: ${item.levelReq} 級`;
          }
          
          inventoryFields.push({ name: `${item.name} x${quantity}`, value: itemDesc, inline: true });
        }
      }
    }
  }
  
  if (inventoryFields.length === 0) {
    inventoryFields.push({ name: '無物品', value: '你的背包是空的', inline: true });
  }
  
  embed.addFields({ name: '物品', value: '以下是你背包中的物品', inline: false });
  if (inventoryFields.length > 0) {
    embed.addFields(...inventoryFields);
  }
  
  // 添加資源信息
  if (playerData.resources) {
    const resourcesText = 
      `農作物: ${playerData.resources.crops || 0} | ` +
      `礦石: ${playerData.resources.ores || 0} | ` +
      `魚: ${playerData.resources.fish || 0} | ` +
      `木材: ${playerData.resources.wood || 0} | ` +
      `草藥: ${playerData.resources.herbs || 0}`;
    
    embed.addFields({ name: '資源', value: resourcesText, inline: false });
  }
  
  // 創建使用物品按鈕
  const useButton = new ButtonBuilder()
    .setCustomId('inventory_use')
    .setLabel('使用物品')
    .setStyle(ButtonStyle.Primary);
    
  const equipButton = new ButtonBuilder()
    .setCustomId('inventory_equip')
    .setLabel('裝備物品')
    .setStyle(ButtonStyle.Primary);
    
  const backButton = new ButtonBuilder()
    .setCustomId('back_to_main')
    .setLabel('返回主選單')
    .setStyle(ButtonStyle.Secondary);
  
  const row = new ActionRowBuilder()
    .addComponents(useButton, equipButton, backButton);
  
  await interaction.update({
    embeds: [embed],
    components: [row]
  });
}

// 處理背包操作
async function handleInventoryAction(interaction) {
  const actionId = interaction.customId;
  
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
  
  // 根據操作ID處理不同功能
  if (actionId === 'inventory_use') {
    await createUseItemMenu(interaction, playerData);
  } else if (actionId === 'inventory_equip') {
    await createEquipItemMenu(interaction, playerData);
  }
}

// 創建使用物品選單
async function createUseItemMenu(interaction, playerData) {
  // 過濾出可使用的物品
  const usableItems = [];
  
  if (playerData.inventory && Object.keys(playerData.inventory).length > 0) {
    // 遍歷所有物品ID和數量
    for (const [itemId, quantity] of Object.entries(playerData.inventory)) {
      if (quantity > 0) {
        const item = items[itemId];
        if (item && (item.type === 'consumable' || item.effects)) {
          usableItems.push({
            id: itemId,
            name: item.name,
            description: item.description,
            quantity: quantity,
            type: item.type
          });
        }
      }
    }
  }
  
  if (usableItems.length === 0) {
    // 創建返回背包按鈕
    const backButton = new ButtonBuilder()
      .setCustomId('inventory')
      .setLabel('返回背包')
      .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
      content: '你沒有可使用的物品！',
      components: [buttonRow],
      embeds: []
    });
    
    return;
  }
  
  // 創建物品選擇選單
  const select = new StringSelectMenuBuilder()
    .setCustomId('use_item')
    .setPlaceholder('選擇要使用的物品');
  
  usableItems.forEach(item => {
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${item.name} x${item.quantity}`)
        .setDescription(item.description || '無描述')
        .setValue(item.id.toString())
    );
  });
  
  const selectRow = new ActionRowBuilder().addComponents(select);
  
  const backButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('返回背包')
    .setStyle(ButtonStyle.Secondary);
  
  const buttonRow = new ActionRowBuilder().addComponents(backButton);
  
  await interaction.update({
    content: '選擇你想要使用的物品：',
    components: [selectRow, buttonRow],
    embeds: []
  });
}

// 創建裝備物品選單
async function createEquipItemMenu(interaction, playerData) {
  // 過濾出可裝備的物品
  const equipableItems = [];
  
  if (playerData.inventory && Object.keys(playerData.inventory).length > 0) {
    // 遍歷所有物品ID和數量
    for (const [itemId, quantity] of Object.entries(playerData.inventory)) {
      if (quantity > 0) {
        const item = items[itemId];
        if (item && (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory')) {
          equipableItems.push({
            id: itemId,
            name: item.name,
            description: item.description,
            quantity: quantity,
            type: item.type,
            levelReq: item.levelReq
          });
        }
      }
    }
  }
  
  if (equipableItems.length === 0) {
    // 創建返回背包按鈕
    const backButton = new ButtonBuilder()
      .setCustomId('inventory')
      .setLabel('返回背包')
      .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
      content: '你沒有可裝備的物品！',
      components: [buttonRow],
      embeds: []
    });
    
    return;
  }
  
  // 創建物品選擇選單
  const select = new StringSelectMenuBuilder()
    .setCustomId('equip_item')
    .setPlaceholder('選擇要裝備的物品');
  
  equipableItems.forEach(item => {
    let description = item.description || '無描述';
    
    // 顯示等級限制
    if (item.levelReq && item.levelReq > 1) {
      description += ` (等級限制: ${item.levelReq})`;
    }
    
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(`${item.name} x${item.quantity}`)
        .setDescription(description)
        .setValue(item.id.toString())
    );
  });
  
  const selectRow = new ActionRowBuilder().addComponents(select);
  
  const backButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('返回背包')
    .setStyle(ButtonStyle.Secondary);
  
  const buttonRow = new ActionRowBuilder().addComponents(backButton);
  
  await interaction.update({
    content: '選擇你想要裝備的物品：',
    components: [selectRow, buttonRow],
    embeds: []
  });
}

// 處理使用物品
async function handleUseItem(interaction) {
  // 獲取選擇的物品ID
  const itemId = interaction.values[0];
  
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
  
  // 檢查玩家是否有該物品
  if (!playerData.inventory || !playerData.inventory[itemId] || playerData.inventory[itemId] <= 0) {
    // 創建返回背包按鈕
    const backButton = new ButtonBuilder()
      .setCustomId('inventory')
      .setLabel('返回背包')
      .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
      content: '你沒有這個物品！',
      components: [buttonRow]
    });
    
    return;
  }
  
  // 使用物品
  const item = items[itemId];
  let message = '';
  let usedItem = false;
  
  switch (itemId) {
    case 'item_potion':
      // 治療藥水
      if (playerData.hp < playerData.maxHp) {
        const healAmount = 50;
        playerData.hp = Math.min(playerData.hp + healAmount, playerData.maxHp);
        message = `你使用了${item.name}，恢復了${healAmount}點生命值！`;
        usedItem = true;
      } else {
        message = '你的生命值已經是滿的！';
      }
      break;
    case 'item_ether':
      // 魔法藥水
      if (playerData.mp < playerData.maxMp) {
        const mpAmount = 30;
        playerData.mp = Math.min(playerData.mp + mpAmount, playerData.maxMp);
        message = `你使用了${item.name}，恢復了${mpAmount}點魔力！`;
        usedItem = true;
      } else {
        message = '你的魔力已經是滿的！';
      }
      break;
    default:
      // 如果物品有恢復效果
      if (item.effects && item.effects.restore) {
        const restoreEffect = item.effects.restore;
        
        if (restoreEffect.hp && playerData.hp < playerData.maxHp) {
          const healAmount = restoreEffect.hp;
          playerData.hp = Math.min(playerData.hp + healAmount, playerData.maxHp);
          message = `你使用了${item.name}，恢復了${healAmount}點生命值！`;
          usedItem = true;
        } else if (restoreEffect.mp && playerData.mp < playerData.maxMp) {
          const mpAmount = restoreEffect.mp;
          playerData.mp = Math.min(playerData.mp + mpAmount, playerData.maxMp);
          message = `你使用了${item.name}，恢復了${mpAmount}點魔力！`;
          usedItem = true;
        } else {
          message = '你的生命值和魔力已經是滿的！';
        }
      } else {
        message = '這個物品無法使用！';
      }
  }

  // 如果物品被使用，減少數量
  if (usedItem) {
    playerData.inventory[itemId] -= 1;

    // 如果數量為0，從背包中移除
    if (playerData.inventory[itemId] <= 0) {
      delete playerData.inventory[itemId];
    }

    // 保存玩家資料
    setPlayerData(playerId, playerData);
  }

  // 創建返回背包按鈕
  const backButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('返回背包')
    .setStyle(ButtonStyle.Secondary);
  
  const buttonRow = new ActionRowBuilder().addComponents(backButton);
  
  await interaction.update({
    content: message,
    components: [buttonRow]
  });
}

// 處理裝備物品
async function handleEquipItem(interaction) {
  // 獲取選擇的物品ID
  const itemId = interaction.values[0];
  
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
  
  // 檢查玩家是否有該物品
  if (!playerData.inventory || !playerData.inventory[itemId] || playerData.inventory[itemId] <= 0) {
    // 創建返回背包按鈕
    const backButton = new ButtonBuilder()
      .setCustomId('inventory')
      .setLabel('返回背包')
      .setStyle(ButtonStyle.Secondary);
    
    const buttonRow = new ActionRowBuilder().addComponents(backButton);
    
    await interaction.update({
      content: '你沒有這個物品！',
      components: [buttonRow]
    });
    
    return;
  }
  
  // 使用 items.js 中的 equipItem 函數來裝備物品
  const { equipItem } = require('./items');
  const result = equipItem(playerData, itemId);
  
  // 如果裝備成功，減少物品數量
  if (result.success) {
    // 減少物品數量
    playerData.inventory[itemId] -= 1;
    
    // 如果數量為0，從背包中移除
    if (playerData.inventory[itemId] <= 0) {
      delete playerData.inventory[itemId];
    }
    
    // 保存玩家資料
    setPlayerData(playerId, playerData);
  }
  
  // 創建返回背包按鈕
  const backButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('返回背包')
    .setStyle(ButtonStyle.Secondary);
  
  const buttonRow = new ActionRowBuilder().addComponents(backButton);
  
  // 顯示結果訊息
  await interaction.update({
    content: result.message,
    components: [buttonRow]
  });
}

module.exports = {
  handleInventory,
  handleInventoryAction,
  handleUseItem,
  handleEquipItem
};
