const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } = require('discord.js');

// 創建職業選擇選單
function createClassSelectMenu() {
  const select = new StringSelectMenuBuilder()
    .setCustomId('class_select')
    .setPlaceholder('選擇你的職業')
    .addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel('戰士')
        .setDescription('高生命值和防禦力的近戰職業')
        .setValue('warrior'),
      new StringSelectMenuOptionBuilder()
        .setLabel('法師')
        .setDescription('高魔法攻擊力的遠程職業')
        .setValue('mage'),
      new StringSelectMenuOptionBuilder()
        .setLabel('弓箭手')
        .setDescription('高敏捷和命中率的遠程職業')
        .setValue('archer')
    );
    
  const row = new ActionRowBuilder()
    .addComponents(select);
    
  return row;
}

// 創建技能選擇選單
function createSkillSelectMenu(playerClass) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('skill_select')
    .setPlaceholder('選擇技能');
    
  // 根據職業添加不同技能
  switch (playerClass) {
    case 'warrior':
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('猛擊')
          .setDescription('對敵人造成更高傷害')
          .setValue('heavy_strike'),
        new StringSelectMenuOptionBuilder()
          .setLabel('防禦姿態')
          .setDescription('提高防禦力')
          .setValue('defensive_stance')
      );
      break;
    case 'mage':
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('火球術')
          .setDescription('對敵人造成魔法傷害')
          .setValue('fireball'),
        new StringSelectMenuOptionBuilder()
          .setLabel('治療術')
          .setDescription('恢復生命值')
          .setValue('heal')
      );
      break;
    case 'archer':
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('瞄準射擊')
          .setDescription('對敵人造成高傷害')
          .setValue('aimed_shot'),
        new StringSelectMenuOptionBuilder()
          .setLabel('快速射擊')
          .setDescription('連續射出兩箭')
          .setValue('rapid_shot')
      );
      break;
    default:
      // 通用技能
      select.addOptions(
        new StringSelectMenuOptionBuilder()
          .setLabel('普通攻擊')
          .setDescription('對敵人造成基本傷害')
          .setValue('attack')
      );
  }
    
  const row = new ActionRowBuilder()
    .addComponents(select);
    
  return row;
}

// 創建物品選擇選單
function createItemSelectMenu(items) {
  const select = new StringSelectMenuBuilder()
    .setCustomId('item_select')
    .setPlaceholder('選擇物品');
    
  // 添加物品選項
  items.forEach(item => {
    select.addOptions(
      new StringSelectMenuOptionBuilder()
        .setLabel(item.name)
        .setDescription(item.description)
        .setValue(item.id)
    );
  });
    
  const row = new ActionRowBuilder()
    .addComponents(select);
    
  return row;
}

module.exports = {
  createClassSelectMenu,
  createSkillSelectMenu,
  createItemSelectMenu
};