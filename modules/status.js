const { EmbedBuilder } = require('discord.js');
const { getPlayerData } = require('./data');
const { getClassName } = require('./commands');

// 處理角色狀態
async function handleStatus(interaction) {
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
  
  // 計算經驗值百分比
  const expNeeded = playerData.level * 100;
  const expPercentage = Math.floor((playerData.exp / expNeeded) * 100);
  
  // 創建進度條
  const createProgressBar = (current, max, length = 10) => {
    const filledLength = Math.floor((current / max) * length);
    const emptyLength = length - filledLength;
    
    const filled = '█'.repeat(filledLength);
    const empty = '░'.repeat(emptyLength);
    
    return filled + empty;
  };
  
  // 創建HP和MP進度條
  const hpBar = createProgressBar(playerData.hp, playerData.maxHp, 15);
  const mpBar = createProgressBar(playerData.mp, playerData.maxMp, 15);
  const expBar = createProgressBar(playerData.exp, expNeeded, 15);
  
  // 獲取裝備信息
  const equipment = playerData.equipment || {};
  const weaponName = equipment.weapon ? `${equipment.weapon}` : '無';
  const armorName = equipment.armor ? `${equipment.armor}` : '無';
  
  // 創建嵌入訊息
  const embed = new EmbedBuilder()
    .setColor(0x0099FF)
    .setTitle(`👤 ${playerData.name} 的角色狀態`)
    .setDescription(`職業：${getClassName(playerData.class)} | 等級：${playerData.level}`)
    .addFields(
      { name: '生命值', value: `${hpBar} ${playerData.hp}/${playerData.maxHp}`, inline: false },
      { name: '魔法值', value: `${mpBar} ${playerData.mp}/${playerData.maxMp}`, inline: false },
      { name: '經驗值', value: `${expBar} ${playerData.exp}/${expNeeded} (${expPercentage}%)`, inline: false },
      { name: '攻擊力', value: `${playerData.attack}`, inline: true },
      { name: '防禦力', value: `${playerData.defense}`, inline: true },
      { name: '金幣', value: `${playerData.gold}`, inline: true },
      { name: '武器', value: weaponName, inline: true },
      { name: '防具', value: armorName, inline: true }
    );
  
  // 如果有生產技能，顯示技能等級
  if (playerData.skills) {
    embed.addFields(
      { name: '生產技能', value: 
        `農業: Lv.${playerData.skills.farming} | ` +
        `採礦: Lv.${playerData.skills.mining} | ` +
        `釣魚: Lv.${playerData.skills.fishing} | ` +
        `製作: Lv.${playerData.skills.crafting}`, 
        inline: false }
    );
  }
  
  // 如果有資源，顯示資源數量
  if (playerData.resources) {
    embed.addFields(
      { name: '資源', value: 
        `農作物: ${playerData.resources.crops} | ` +
        `礦石: ${playerData.resources.ores} | ` +
        `魚: ${playerData.resources.fish} | ` +
        `木材: ${playerData.resources.wood} | ` +
        `藥草: ${playerData.resources.herbs}`, 
        inline: false }
    );
  }
  
  // 創建返回主選單按鈕
  const { createMainMenuButtons } = require('./buttons');
  const mainMenuRows = createMainMenuButtons();
  
  await interaction.update({
    embeds: [embed],
    components: mainMenuRows,
    content: ''
  });
}

module.exports = {
  handleStatus
};
