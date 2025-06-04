const { EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, AttachmentBuilder } = require('discord.js');
const { getPlayerData, setPlayerData } = require('./data');
const { Battle } = require('./battle');
const fs = require('fs');
const path = require('path');

// 處理技能選擇
async function handleSkillSelection(interaction) {
  // 獲取選擇的技能ID
  const skillId = interaction.values[0];
  
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
  
  // 檢查玩家是否在戰鬥中
  if (!playerData.inBattle) {
    await interaction.update({
      content: '你現在不在戰鬥中！',
      components: []
    });
    return;
  }
  
  // 檢查玩家魔力是否足夠
  const mpCost = 10; // 假設每個技能消耗10點魔力
  if (playerData.mp < mpCost) {
    // 創建戰鬥按鈕
    const { createBattleButtons } = require('./buttons');
    const battleButtons = createBattleButtons();
    
    await interaction.update({
      content: `你的魔力不足以使用技能！\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
      components: [battleButtons]
    });
    return;
  }
  
  // 根據職業獲取技能信息
  const { getSkillsByClass } = require('./buttons');
  const skills = getSkillsByClass(playerData.class);
  const skill = skills.find(s => s.id === skillId);
  
  if (!skill) {
    // 創建戰鬥按鈕
    const { createBattleButtons } = require('./buttons');
    const battleButtons = createBattleButtons();
    
    await interaction.update({
      content: `技能無效或不存在！\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
      components: [battleButtons]
    });
    return;
  }
  
  // 執行技能效果
  let damage = 0;
  let healAmount = 0;
  let message = `你使用了${skill.name}，`;
  
  // 處理技能效果
  if (skill.damage) {
    // 計算傷害
    if (skill.damage.includes('%')) {
      const multiplier = parseFloat(skill.damage) / 100;
      const attackStat = skill.id === 'fireball' || skill.id === 'ice_spike' || skill.id === 'lightning' 
        ? (playerData.magic || playerData.attack) 
        : playerData.attack;
      damage = Math.floor(attackStat * multiplier);
    } else {
      damage = parseInt(skill.damage) || 0;
    }
    
    // 特殊技能處理
    if (skill.id === 'multi_shot') {
      // 多重射擊特殊處理
      const hits = 3;
      const hitDamage = Math.floor(damage * 0.3);
      damage = hitDamage * hits;
      message += `對怪物進行了${hits}次射擊，共造成${damage}點傷害！`;
    } else if (skill.id === 'assassinate') {
      // 暗殺有機率即死
      if (Math.random() < 0.1) { // 10% 機率即死
        damage = playerData.currentEnemy.hp;
        message += `發動了致命一擊！`;
      } else {
        message += `對怪物造成了${damage}點傷害！`;
      }
    } else {
      message += `對怪物造成了${damage}點傷害！`;
    }
  }
  
  // 處理治療效果
  if (skill.effect && skill.effect.includes('恢復')) {
    healAmount = Math.floor((playerData.magic || playerData.level * 10) * 1.5);
    playerData.hp = Math.min(playerData.hp + healAmount, playerData.maxHp);
    message += ` 並恢復了${healAmount}點生命值！`;
  }
  
  // 處理防禦提升
  if (skill.id === 'taunt') {
    playerData.defense += 5;
    message += ' 防禦力提升了5點！';
  }
  
  // 處理中毒效果
  if (skill.id === 'poison_arrow') {
    playerData.currentEnemy.status = playerData.currentEnemy.status || [];
    playerData.currentEnemy.status.push({
      type: 'poison',
      damage: Math.floor(playerData.attack * 0.3),
      duration: 3
    });
    message += ' 目標中毒了！';
  }
  
  // 處理暈眩效果
  if (skill.id === 'shield_bash') {
    playerData.currentEnemy.status = playerData.currentEnemy.status || [];
    playerData.currentEnemy.status.push({
      type: 'stun',
      duration: 1
    });
    message += ' 目標被暈眩了！';
  }
  
  // 處理減速效果
  if (skill.id === 'ice_spike') {
    playerData.currentEnemy.status = playerData.currentEnemy.status || [];
    playerData.currentEnemy.status.push({
      type: 'slow',
      amount: 0.7, // 減速30%
      duration: 2
    });
    message += ' 目標被減速了！';
  }
  
  // 扣除魔力
  playerData.mp -= mpCost;
  
  // 如果造成傷害，則減少怪物生命值
  if (damage > 0) {
    playerData.currentEnemy.hp -= damage;
  }
  
  // 檢查怪物是否被擊敗
  if (playerData.currentEnemy.hp <= 0) {
    await handleEnemyDefeated(interaction, playerData, message);
  } else {
    // 怪物反擊
    await handleEnemyCounterattack(interaction, playerData, message);
  }
}

// 處理怪物被擊敗
async function handleEnemyDefeated(interaction, playerData, message) {
  playerData.inBattle = false;
  
  // 獲得經驗值和金幣
  const expGained = playerData.currentEnemy.expReward || playerData.currentEnemy.exp || 10;
  const goldGained = playerData.currentEnemy.goldReward || playerData.currentEnemy.gold || 5;
  
  playerData.exp += expGained;
  playerData.gold += goldGained;
  
  // 檢查是否升級
  const expNeeded = playerData.level * 100;
  if (playerData.exp >= expNeeded) {
    playerData.level += 1;
    playerData.exp -= expNeeded;
    playerData.maxHp += 10;
    playerData.maxMp += 5;
    playerData.hp = playerData.maxHp;
    playerData.mp = playerData.maxMp;
    playerData.attack += 2;
    playerData.defense += 1;
    playerData.magic += 1;
    playerData.agility += 1;
    
    message += `\n\n你擊敗了${playerData.currentEnemy.name}！\n獲得了${expGained}點經驗值和${goldGained}金幣！\n恭喜你升級了！現在你是${playerData.level}級了！`;
  } else {
    message += `\n\n你擊敗了${playerData.currentEnemy.name}！\n獲得了${expGained}點經驗值和${goldGained}金幣！`;
  }
  
  // 保存玩家資料
  setPlayerData(interaction.user.id, playerData);
  
  // 創建繼續探索按鈕
  const exploreButton = new ButtonBuilder()
    .setCustomId(`continue_explore_${playerData.currentArea}`)
    .setLabel('繼續探索')
    .setStyle(ButtonStyle.Primary);
    
  const inventoryButton = new ButtonBuilder()
    .setCustomId('inventory')
    .setLabel('查看背包')
    .setStyle(ButtonStyle.Secondary);
    
  const mainMenuButton = new ButtonBuilder()
    .setCustomId('back_to_main')
    .setLabel('返回主選單')
    .setStyle(ButtonStyle.Success);
    
  const row = new ActionRowBuilder()
    .addComponents(exploreButton, inventoryButton, mainMenuButton);
  
  // 創建嵌入訊息
  const embed = new EmbedBuilder()
    .setTitle('戰鬥勝利')
    .setDescription(message)
    .setColor('#00FF00');
  
  try {
    // 嘗試加載怪物圖片
    let attachment = null;
    try {
      const { getMonsterImagePath } = require('./images');
      const imagePath = getMonsterImagePath(playerData.currentEnemy.name);
      
      if (imagePath && fs.existsSync(imagePath)) {
        attachment = new AttachmentBuilder(imagePath);
        embed.setImage(`attachment://${path.basename(attachment.attachment.toString())}`);
      }
    } catch (imageError) {
      console.error('加載怪物圖片時出錯:', imageError);
      // 圖片加載失敗不影響主要功能
    }
    
    // 更新交互
    if (attachment) {
      await interaction.update({
        content: '',
        embeds: [embed],
        files: [attachment],
        components: [row]
      });
    } else {
      await interaction.update({
        content: '',
        embeds: [embed],
        components: [row]
      });
    }
  } catch (error) {
    console.error('更新交互時出錯:', error);
    // 嘗試簡化更新
    try {
      await interaction.update({
        content: message,
        components: [row]
      });
    } catch (simpleError) {
      console.error('簡化更新交互時出錯:', simpleError);
    }
  }
}

// 處理怪物反擊
async function handleEnemyCounterattack(interaction, playerData, message) {
  // 怪物反擊
  const enemyDamage = Math.max(1, playerData.currentEnemy.attack - playerData.defense);
  playerData.hp -= enemyDamage;
  
  message += `\n\n${playerData.currentEnemy.name}對你造成了${enemyDamage}點傷害！`;
  
  // 檢查玩家是否被擊敗
  if (playerData.hp <= 0) {
    await handlePlayerDefeated(interaction, playerData, message);
    return;
  }
  
  // 保存玩家資料
  setPlayerData(interaction.user.id, playerData);
  
  // 創建戰鬥按鈕
  const { createBattleButtons } = require('./buttons');
  const battleButtons = createBattleButtons();
  
  // 創建戰鬥嵌入式消息
  const battleEmbed = new EmbedBuilder()
    .setColor('#FF5733')
    .setTitle(`戰鬥！${interaction.user.username} vs ${playerData.currentEnemy.name}`)
    .setDescription(message)
    .addFields(
      { name: '你的狀態', value: `生命值: ${playerData.hp}/${playerData.maxHp}\n魔力: ${playerData.mp}/${playerData.maxMp}\n攻擊力: ${playerData.attack}\n防禦力: ${playerData.defense}`, inline: true },
      { name: '怪物狀態', value: `生命值: ${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}\n攻擊力: ${playerData.currentEnemy.attack}\n防禦力: ${playerData.currentEnemy.defense}`, inline: true }
    )
    .setFooter({ text: '選擇下方按鈕繼續戰鬥' })
    .setTimestamp();
  
  // 嘗試加載怪物圖片
  try {
    if (playerData.currentEnemy.imagePath) {
      battleEmbed.setThumbnail(`attachment://${path.basename(playerData.currentEnemy.imagePath)}`);
      const monsterImage = new AttachmentBuilder(playerData.currentEnemy.imagePath);
      
      // 使用try-catch來處理可能的交互已回覆錯誤
      try {
        await interaction.update({
          embeds: [battleEmbed],
          components: [battleButtons],
          files: [monsterImage]
        });
      } catch (interactionError) {
        console.error('交互更新錯誤:', interactionError);
        // 如果交互已回覆，不需要再次回覆
      }
    } else {
      try {
        await interaction.update({
          embeds: [battleEmbed],
          components: [battleButtons]
        });
      } catch (interactionError) {
        console.error('交互更新錯誤:', interactionError);
        // 如果交互已回覆，不需要再次回覆
      }
    }
  } catch (error) {
    console.error('加載怪物圖片時出錯:', error);
    try {
      await interaction.update({
        embeds: [battleEmbed],
        components: [battleButtons]
      });
    } catch (interactionError) {
      console.error('交互更新錯誤:', interactionError);
      // 如果交互已回覆，不需要再次回覆
    }
  }
}

// 處理玩家被擊敗
async function handlePlayerDefeated(interaction, playerData, message) {
  playerData.hp = 0;
  playerData.inBattle = false;
  
  message += '\n\n你被擊敗了！';
  
  // 創建重新開始按鈕
  const restartButton = new ButtonBuilder()
    .setCustomId('start_game')
    .setLabel('重新開始')
    .setStyle(ButtonStyle.Danger);
    
  const row = new ActionRowBuilder()
    .addComponents(restartButton);
  
  // 創建嵌入訊息
  const embed = new EmbedBuilder()
    .setTitle('戰鬥失敗')
    .setDescription(message)
    .setColor('#FF0000');
  
  try {
    await interaction.update({
      embeds: [embed],
      components: [row]
    });
  } catch (error) {
    console.error('更新交互時出錯:', error);
    // 嘗試簡化更新
    try {
      await interaction.update({
        content: message,
        components: [row]
      });
    } catch (simpleError) {
      console.error('簡化更新交互時出錯:', simpleError);
    }
  }
  
  // 刪除玩家資料
  setPlayerData(interaction.user.id, null);
}

// 處理戰鬥動作選擇
async function handleBattleAction(interaction) {
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
  
  // 檢查玩家是否在戰鬥中
  if (!playerData.inBattle) {
    await interaction.update({
      content: '你現在不在戰鬥中！',
      components: []
    });
    return;
  }
  
  // 根據不同的戰鬥動作執行不同的操作
  switch (actionId) {
    case 'battle_attack':
      await handleAttack(interaction);
      break;
    case 'battle_skill':
      // 創建技能選擇選單
      const { createSkillSelectMenu } = require('./buttons');
      const skillMenuRow = createSkillSelectMenu(playerData.class);
      
      await interaction.update({
        content: `選擇你想使用的技能：\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
        components: [skillMenuRow]
      });
      break;
    case 'battle_item':
      // 創建物品選擇選單
      const { createItemSelectMenu } = require('./buttons');
      const itemMenuRow = createItemSelectMenu(playerData.inventory);
      
      await interaction.update({
        content: `選擇你想使用的物品：\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
        components: [itemMenuRow]
      });
      break;
    case 'battle_flee':
      // 嘗試逃跑
      const fleeChance = 0.5; // 50%機率逃跑成功
      
      if (Math.random() < fleeChance) {
        // 逃跑成功
        playerData.inBattle = false;
        
        // 保存玩家資料
        setPlayerData(playerId, playerData);
        
        // 創建主選單按鈕
        const { createMainMenuButtons } = require('./buttons');
        const mainMenuRow = createMainMenuButtons();
        
        await interaction.update({
          content: '你成功逃離了戰鬥！',
          components: [mainMenuRow]
        });
      } else {
        // 逃跑失敗，怪物攻擊
        const enemyDamage = Math.max(1, playerData.currentEnemy.attack - playerData.defense);
        playerData.hp -= enemyDamage;
        
        // 檢查玩家是否被擊敗
        if (playerData.hp <= 0) {
          await handlePlayerDefeated(interaction, playerData, `逃跑失敗！${playerData.currentEnemy.name}對你造成了${enemyDamage}點傷害！`);
          return;
        }
        
        // 保存玩家資料
        setPlayerData(playerId, playerData);
        
        // 創建戰鬥按鈕
        const { createBattleButtons } = require('./buttons');
        const battleButtons = createBattleButtons();
        
        await interaction.update({
          content: `逃跑失敗！${playerData.currentEnemy.name}對你造成了${enemyDamage}點傷害！\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
          components: [battleButtons]
        });
      }
      break;
    default:
      await interaction.update({
        content: '未知的戰鬥動作！',
        components: []
      });
      break;
  }
}

// 處理攻擊按鈕
async function handleAttack(interaction) {
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
  
  // 檢查玩家是否在戰鬥中
  if (!playerData.inBattle) {
    await interaction.update({
      content: '你現在不在戰鬥中！',
      components: []
    });
    return;
  }
  
  // 計算玩家造成的傷害
  const damage = Math.max(1, playerData.attack - Math.floor(playerData.currentEnemy.defense / 2));
  
  // 減少怪物生命值
  playerData.currentEnemy.hp -= damage;
  
  // 初始戰鬥訊息
  let battleMessage = `你攻擊了${playerData.currentEnemy.name}，造成了${damage}點傷害！`;
  
  // 如果怪物被擊敗
  if (playerData.currentEnemy.hp <= 0) {
    await handleEnemyDefeated(interaction, playerData, battleMessage);
    return;
  }
  
  // 怪物反擊
  const enemyDamage = Math.max(1, playerData.currentEnemy.attack - playerData.defense);
  playerData.hp -= enemyDamage;
  
  // 添加怪物反擊訊息
  battleMessage += `\n\n${playerData.currentEnemy.name}對你造成了${enemyDamage}點傷害！`;
  
  // 檢查玩家是否被擊敗
  if (playerData.hp <= 0) {
    await handlePlayerDefeated(interaction, playerData, battleMessage);
    return;
  }
  
  // 保存玩家資料
  setPlayerData(interaction.user.id, playerData);
  
  // 創建戰鬥按鈕
  const { createBattleButtons } = require('./buttons');
  const battleButtons = createBattleButtons();
  
  // 創建戰鬥嵌入式消息
  const battleEmbed = new EmbedBuilder()
    .setColor('#FF5733')
    .setTitle(`戰鬥！${interaction.user.username} vs ${playerData.currentEnemy.name}`)
    .setDescription(battleMessage)
    .addFields(
      { name: '你的狀態', value: `生命值: ${playerData.hp}/${playerData.maxHp}\n魔力: ${playerData.mp}/${playerData.maxMp}\n攻擊力: ${playerData.attack}\n防禦力: ${playerData.defense}`, inline: true },
      { name: '怪物狀態', value: `生命值: ${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}\n攻擊力: ${playerData.currentEnemy.attack}\n防禦力: ${playerData.currentEnemy.defense}`, inline: true }
    )
    .setFooter({ text: '選擇下方按鈕繼續戰鬥' })
    .setTimestamp();
  
  // 嘗試加載怪物圖片
  try {
    if (playerData.currentEnemy.imagePath) {
      battleEmbed.setThumbnail(`attachment://${path.basename(playerData.currentEnemy.imagePath)}`);
      const monsterImage = new AttachmentBuilder(playerData.currentEnemy.imagePath);
      
      await interaction.update({
        embeds: [battleEmbed],
        components: [battleButtons],
        files: [monsterImage]
      });
    } else {
      await interaction.update({
        embeds: [battleEmbed],
        components: [battleButtons]
      });
    }
  } catch (error) {
    console.error('加載怪物圖片或更新交互時出錯:', error);
    
    // 如果加載圖片失敗，嘗試不使用圖片更新
    try {
      await interaction.update({
        embeds: [battleEmbed],
        components: [battleButtons]
      });
    } catch (updateError) {
      console.error('更新交互時出錯:', updateError);
    }
  }
}

// 處理物品選擇
async function handleItemSelection(interaction) {
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
  
  // 檢查玩家是否在戰鬥中
  if (!playerData.inBattle) {
    await interaction.update({
      content: '你現在不在戰鬥中！',
      components: []
    });
    return;
  }
  
  // 檢查玩家是否有該物品
  const itemIndex = playerData.inventory.findIndex(item => item.id === itemId);
  if (itemIndex === -1 || playerData.inventory[itemIndex].quantity <= 0) {
    // 創建戰鬥按鈕
    const { createBattleButtons } = require('./buttons');
    const battleButtons = createBattleButtons();
    
    await interaction.update({
      content: `你沒有這個物品！\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
      components: [battleButtons]
    });
    return;
  }
  
  // 使用物品
  const item = playerData.inventory[itemIndex];
  let message = '';
  let usedItem = false;
  
  switch (item.id) {
    case 'item_potion':
      // 治療藥水
      const healAmount = 50;
      playerData.hp = Math.min(playerData.hp + healAmount, playerData.maxHp);
      message = `你使用了${item.name}，恢復了${healAmount}點生命值！`;
      usedItem = true;
      break;
    case 'item_ether':
      // 魔法藥水
      const mpAmount = 30;
      playerData.mp = Math.min(playerData.mp + mpAmount, playerData.maxMp);
      message = `你使用了${item.name}，恢復了${mpAmount}點魔力！`;
      usedItem = true;
      break;
    case 'item_bomb':
      // 炸彈
      const bombDamage = 50;
      playerData.currentEnemy.hp -= bombDamage;
      message = `你使用了${item.name}，對怪物造成了${bombDamage}點傷害！`;
      usedItem = true;
      break;
    default:
      message = '這個物品無法在戰鬥中使用！';
      break;
  }
  
  // 如果物品被使用，減少數量
  if (usedItem) {
    playerData.inventory[itemIndex].quantity -= 1;
    
    // 如果數量為0，從背包中移除
    if (playerData.inventory[itemIndex].quantity <= 0) {
      playerData.inventory.splice(itemIndex, 1);
    }
  }
  
  // 檢查怪物是否被擊敗
  if (usedItem && playerData.currentEnemy.hp <= 0) {
    await handleEnemyDefeated(interaction, playerData, message);
    return;
  }
  
  // 保存玩家資料
  setPlayerData(playerId, playerData);
  
  // 如果物品被使用，怪物反擊
  if (usedItem) {
    // 怪物反擊
    const enemyDamage = Math.max(1, playerData.currentEnemy.attack - playerData.defense);
    playerData.hp -= enemyDamage;
    
    message += `\n\n${playerData.currentEnemy.name}對你造成了${enemyDamage}點傷害！`;
    
    // 檢查玩家是否被擊敗
    if (playerData.hp <= 0) {
      await handlePlayerDefeated(interaction, playerData, message);
      return;
    }
    
    // 保存玩家資料
    setPlayerData(playerId, playerData);
  }
  
  // 創建戰鬥按鈕
  const { createBattleButtons } = require('./buttons');
  const battleButtons = createBattleButtons();
  
  await interaction.update({
    content: `${message}\n\n你的生命值：${playerData.hp}/${playerData.maxHp}\n你的魔力：${playerData.mp}/${playerData.maxMp}\n\n怪物生命值：${playerData.currentEnemy.hp}/${playerData.currentEnemy.maxHp}`,
    components: [battleButtons]
  });
}

module.exports = {
  handleSkillSelection,
  handleBattleAction,
  handleAttack,
  handleItemSelection
};
