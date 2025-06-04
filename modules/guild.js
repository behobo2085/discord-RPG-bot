const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { getPlayerData, setPlayerData } = require('./data');
const { getClassName } = require('./interactions');

// 處理冒險者公會功能
async function handleGuild(interaction) {
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
  
  // 創建公會嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x8B4513)
    .setTitle('🏠 冒險者公會')
    .setDescription('歡迎來到冒險者公會！這裡提供各種服務和活動。')
    .addFields(
      { name: '休息', value: '花費30金幣休息一晚，完全恢復HP和MP', inline: true },
      { name: '製作裝備', value: '使用資源製作裝備和道具', inline: true }
    );
  
  // 創建公會按鈕
  const { createGuildButtons } = require('./buttons');
  const guildButtons = createGuildButtons();
  
  await interaction.update({
    embeds: [embed],
    components: guildButtons,
    content: null
  });
}

// 處理公會活動
async function handleGuildAction(interaction) {
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  const actionId = interaction.customId;
  
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
  
  // 初始化資源和技能屬性（如果不存在）
  if (!playerData.resources) {
    playerData.resources = {
      crops: 0,
      ores: 0,
      fish: 0,
      wood: 0,
      herbs: 0
    };
  }
  
  if (!playerData.skills) {
    playerData.skills = {
      farming: 1,
      mining: 1,
      fishing: 1,
      crafting: 1
    };
  }
  
  if (!playerData.cooldowns) {
    playerData.cooldowns = {
      farming: 0,
      mining: 0,
      fishing: 0
    };
  }
  
  let embed;
  const now = Date.now();
  
  // 根據不同的活動執行不同的操作
  switch (actionId) {
    case 'guild_rest':
      // 休息功能
      if (playerData.gold >= 30) {
        playerData.gold -= 30;
        playerData.hp = playerData.maxHp;
        playerData.mp = playerData.maxMp;
        
        embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('😴 休息')
          .setDescription('你在冒險者公會休息了一晚，感覺精力充沛！')
          .addFields(
            { name: '消費', value: '30金幣', inline: true },
            { name: 'HP', value: `已恢復至 ${playerData.hp}/${playerData.maxHp}`, inline: true },
            { name: 'MP', value: `已恢復至 ${playerData.mp}/${playerData.maxMp}`, inline: true }
          );
      } else {
        embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('❌ 金幣不足')
          .setDescription('你沒有足夠的金幣支付休息費用。')
          .addFields(
            { name: '需要', value: '30金幣', inline: true },
            { name: '擁有', value: `${playerData.gold}金幣`, inline: true }
          );
      }
      break;
      
    case 'guild_farm':
      // 種田功能
      // 檢查冷卻時間
      if (playerData.cooldowns.farming > now) {
        const remainingTime = Math.ceil((playerData.cooldowns.farming - now) / 1000 / 60);
        embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('⏳ 冷卻中')
          .setDescription(`你需要休息一下才能繼續種田。`)
          .addFields(
            { name: '剩餘時間', value: `${remainingTime}分鐘`, inline: true }
          );
      } else {
        // 根據技能等級獲得資源
        const baseAmount = 1;
        const skillBonus = Math.floor(playerData.skills.farming / 2);
        const amount = baseAmount + skillBonus + Math.floor(Math.random() * 3);
        
        playerData.resources.crops += amount;
        
        // 有機會獲得藥草
        if (Math.random() < 0.3) {
          const herbAmount = 1 + Math.floor(Math.random() * playerData.skills.farming);
          playerData.resources.herbs += herbAmount;
          embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🌾 種田')
            .setDescription(`你辛勤耕作，收穫了一些農作物和藥草！`)
            .addFields(
              { name: '獲得農作物', value: `${amount}個`, inline: true },
              { name: '獲得藥草', value: `${herbAmount}株`, inline: true },
              { name: '農業技能', value: `Lv.${playerData.skills.farming}`, inline: true }
            );
        } else {
          embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('🌾 種田')
            .setDescription(`你辛勤耕作，收穫了一些農作物！`)
            .addFields(
              { name: '獲得農作物', value: `${amount}個`, inline: true },
              { name: '農業技能', value: `Lv.${playerData.skills.farming}`, inline: true }
            );
        }
        
        // 有機會提升技能等級
        if (Math.random() < 0.2) {
          playerData.skills.farming += 1;
          embed.addFields({ name: '🎉 技能提升', value: `農業技能提升到 Lv.${playerData.skills.farming}！`, inline: false });
        }
        
        // 設置冷卻時間（10分鐘）
        playerData.cooldowns.farming = now + 10 * 60 * 1000;
      }
      break;
      
    case 'guild_mine':
      // 挖礦功能
      // 檢查冷卻時間
      if (playerData.cooldowns.mining > now) {
        const remainingTime = Math.ceil((playerData.cooldowns.mining - now) / 1000 / 60);
        embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('⏳ 冷卻中')
          .setDescription(`你需要休息一下才能繼續挖礦。`)
          .addFields(
            { name: '剩餘時間', value: `${remainingTime}分鐘`, inline: true }
          );
      } else {
        // 根據技能等級獲得資源
        const baseAmount = 1;
        const skillBonus = Math.floor(playerData.skills.mining / 2);
        const amount = baseAmount + skillBonus + Math.floor(Math.random() * 3);
        
        playerData.resources.ores += amount;
        
        // 有機會獲得金幣
        if (Math.random() < 0.4) {
          const goldAmount = 5 + Math.floor(Math.random() * (playerData.skills.mining * 2));
          playerData.gold += goldAmount;
          embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⛏️ 挖礦')
            .setDescription(`你在礦洞中挖掘，獲得了一些礦石和金幣！`)
            .addFields(
              { name: '獲得礦石', value: `${amount}個`, inline: true },
              { name: '獲得金幣', value: `${goldAmount}枚`, inline: true },
              { name: '採礦技能', value: `Lv.${playerData.skills.mining}`, inline: true }
            );
        } else {
          embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('⛏️ 挖礦')
            .setDescription(`你在礦洞中挖掘，獲得了一些礦石！`)
            .addFields(
              { name: '獲得礦石', value: `${amount}個`, inline: true },
              { name: '採礦技能', value: `Lv.${playerData.skills.mining}`, inline: true }
            );
        }
        
        // 有機會提升技能等級
        if (Math.random() < 0.2) {
          playerData.skills.mining += 1;
          embed.addFields({ name: '🎉 技能提升', value: `採礦技能提升到 Lv.${playerData.skills.mining}！`, inline: false });
        }
        
        // 設置冷卻時間（15分鐘）
        playerData.cooldowns.mining = now + 15 * 60 * 1000;
      }
      break;
      
    case 'guild_fish':
      // 釣魚功能
      // 檢查冷卻時間
      if (playerData.cooldowns.fishing > now) {
        const remainingTime = Math.ceil((playerData.cooldowns.fishing - now) / 1000 / 60);
        embed = new EmbedBuilder()
          .setColor(0xFF0000)
          .setTitle('⏳ 冷卻中')
          .setDescription(`你需要休息一下才能繼續釣魚。`)
          .addFields(
            { name: '剩餘時間', value: `${remainingTime}分鐘`, inline: true }
          );
      } else {
        // 根據技能等級獲得資源
        const baseAmount = 1;
        const skillBonus = Math.floor(playerData.skills.fishing / 2);
        const amount = baseAmount + skillBonus + Math.floor(Math.random() * 2);
        
        playerData.resources.fish += amount;
        
        embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle('🎣 釣魚')
          .setDescription(`你在湖邊釣魚，收穫了一些魚！`)
          .addFields(
            { name: '獲得魚', value: `${amount}條`, inline: true },
            { name: '釣魚技能', value: `Lv.${playerData.skills.fishing}`, inline: true }
          );
        
        // 有機會提升技能等級
        if (Math.random() < 0.2) {
          playerData.skills.fishing += 1;
          embed.addFields({ name: '🎉 技能提升', value: `釣魚技能提升到 Lv.${playerData.skills.fishing}！`, inline: false });
        }
        
        // 設置冷卻時間（12分鐘）
        playerData.cooldowns.fishing = now + 12 * 60 * 1000;
      }
      break;
      
    case 'guild_craft':
      // 製作裝備功能
      await handleCrafting(interaction);
      return;
      
    default:
      embed = new EmbedBuilder()
        .setColor(0xFF0000)
        .setTitle('❌ 錯誤')
        .setDescription('未知的公會活動。');
      break;
  }
  
  // 保存玩家資料
  setPlayerData(playerId, playerData);
  
  // 創建公會按鈕
  const { createGuildButtons } = require('./buttons');
  const guildButtons = createGuildButtons();
  
  await interaction.update({
    embeds: [embed],
    components: guildButtons
  });
}

// 處理製作裝備功能
async function handleCrafting(interaction) {
  const playerId = interaction.user.id;
  const playerData = getPlayerData(playerId);
  
  // 創建製作選單
  const craftingEmbed = new EmbedBuilder()
    .setColor(0x8B4513)
    .setTitle('🔨 製作裝備')
    .setDescription('使用收集到的資源製作裝備和道具。')
    .addFields(
      { name: '資源', value: 
        `農作物: ${playerData.resources.crops} | ` +
        `礦石: ${playerData.resources.ores} | ` +
        `魚: ${playerData.resources.fish} | ` +
        `木材: ${playerData.resources.wood} | ` +
        `藥草: ${playerData.resources.herbs}`, 
        inline: false },
      { name: '製作技能', value: `Lv.${playerData.skills.crafting}`, inline: false },
      { name: '可製作物品', value: '選擇你想製作的物品：', inline: false },
      { name: '鐵劍', value: '需要: 5礦石, 2木材', inline: true },
      { name: '皮甲', value: '需要: 3農作物, 2礦石', inline: true },
      { name: '治療藥水', value: '需要: 3藥草, 1魚', inline: true }
    );
  
  // 創建製作按鈕
  const craftSwordButton = new ButtonBuilder()
    .setCustomId('craft_sword')
    .setLabel('製作鐵劍')
    .setStyle(ButtonStyle.Primary);
    
  const craftArmorButton = new ButtonBuilder()
    .setCustomId('craft_armor')
    .setLabel('製作皮甲')
    .setStyle(ButtonStyle.Primary);
    
  const craftPotionButton = new ButtonBuilder()
    .setCustomId('craft_potion')
    .setLabel('製作治療藥水')
    .setStyle(ButtonStyle.Success);
    
  const backButton = new ButtonBuilder()
    .setCustomId('guild')
    .setLabel('返回公會')
    .setStyle(ButtonStyle.Secondary);
  
  const row = new ActionRowBuilder()
    .addComponents(craftSwordButton, craftArmorButton, craftPotionButton, backButton);
  
  await interaction.update({
    embeds: [craftingEmbed],
    components: [row]
  });
}

module.exports = {
  handleGuild,
  handleGuildAction
};
