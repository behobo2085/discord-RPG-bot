// 物品類別
class Item {
  constructor(id, name, type, description, price, effects, levelReq) {
    this.id = id;
    this.name = name;
    this.type = type; // weapon, armor, potion, etc.
    this.description = description;
    this.price = price;
    this.effects = effects || {};
    this.levelReq = levelReq || 1; // 預設等級限制為1級
  }
}

// 預定義物品
const items = {
  // 武器 - 初級
  'sword': new Item('sword', '鐵劍', 'weapon', '普通的鐵劍', 100, { attack: 5 }),
  'staff': new Item('staff', '木杖', 'weapon', '普通的木杖', 100, { magic: 5 }),
  'bow': new Item('bow', '短弓', 'weapon', '普通的短弓', 100, { attack: 3, agility: 2 }),
  
  // 武器 - 中級
  'silver_sword': new Item('silver_sword', '銀劍', 'weapon', '由純銀打造的劍', 300, { attack: 10 }),
  'fire_staff': new Item('fire_staff', '火焰法杖', 'weapon', '蘊含火焰魔力的法杖', 300, { magic: 10, attack: 2 }),
  'long_bow': new Item('long_bow', '長弓', 'weapon', '射程更遠的弓', 300, { attack: 7, agility: 5 }),
  
  // 武器 - 高級
  'dragon_slayer': new Item('dragon_slayer', '屠龍劍', 'weapon', '傳說中能夠屠龍的神劍', 1000, { attack: 20, defense: 5 }),
  'archmage_staff': new Item('archmage_staff', '大法師之杖', 'weapon', '蘊含強大魔力的法杖', 1000, { magic: 20, mp: 50 }),
  'elven_bow': new Item('elven_bow', '精靈之弓', 'weapon', '精靈族打造的神弓', 1000, { attack: 15, agility: 15 }),
  
  // 防具 - 初級
  'leather_armor': new Item('leather_armor', '皮甲', 'armor', '普通的皮甲', 80, { defense: 3 }),
  'robe': new Item('robe', '法師長袍', 'armor', '普通的法師長袍', 80, { defense: 1, magic: 2 }),
  'light_armor': new Item('light_armor', '輕甲', 'armor', '輕便的護甲', 80, { defense: 2, agility: 1 }),
  
  // 防具 - 中級
  'chain_mail': new Item('chain_mail', '鎖子甲', 'armor', '由金屬環相扣製成的護甲', 250, { defense: 8 }),
  'enchanted_robe': new Item('enchanted_robe', '附魔長袍', 'armor', '附有魔法的長袍', 250, { defense: 3, magic: 7 }),
  'ranger_armor': new Item('ranger_armor', '遊俠護甲', 'armor', '適合遠程作戰的護甲', 250, { defense: 5, agility: 5 }),
  
  // 防具 - 高級
  'plate_armor': new Item('plate_armor', '板甲', 'armor', '全身板甲，提供極高防禦', 800, { defense: 15, hp: 50 }),
  'archmage_robe': new Item('archmage_robe', '大法師長袍', 'armor', '蘊含強大魔力的長袍', 800, { defense: 7, magic: 15, mp: 50 }),
  'shadow_cloak': new Item('shadow_cloak', '暗影披風', 'armor', '能夠融入陰影的披風', 800, { defense: 10, agility: 12 }),
  
  // 藥水 - 初級
  'hp_potion': new Item('hp_potion', '紅藥水', 'potion', '恢復 30 點生命值', 20, { restore: { hp: 30 } }),
  'mp_potion': new Item('mp_potion', '藍藥水', 'potion', '恢復 20 點魔力', 20, { restore: { mp: 20 } }),
  
  // 藥水 - 中級
  'greater_hp_potion': new Item('greater_hp_potion', '大紅藥水', 'potion', '恢復 80 點生命值', 50, { restore: { hp: 80 } }),
  'greater_mp_potion': new Item('greater_mp_potion', '大藍藥水', 'potion', '恢復 50 點魔力', 50, { restore: { mp: 50 } }),
  'elixir': new Item('elixir', '萬能藥劑', 'potion', '恢復 40 點生命值和 30 點魔力', 80, { restore: { hp: 40, mp: 30 } }),
  
  // 藥水 - 高級
  'super_hp_potion': new Item('super_hp_potion', '超級紅藥水', 'potion', '恢復 200 點生命值', 120, { restore: { hp: 200 } }),
  'super_mp_potion': new Item('super_mp_potion', '超級藍藥水', 'potion', '恢復 150 點魔力', 120, { restore: { mp: 150 } }),
  'full_restore': new Item('full_restore', '完全恢復藥劑', 'potion', '完全恢復生命值和魔力', 300, { restore: { hp: 999, mp: 999 } }),
  
  // 鋼鐵系列裝備 - 5級限制
  'steel_helmet': new Item('steel_helmet', '鋼鐵頭盔', 'armor', '堅固的鋼鐵頭盔，提供良好的頭部防護', 350, { defense: 7, hp: 20 }, 5),
  'steel_armor': new Item('steel_armor', '鋼鐵盔甲', 'armor', '由高品質鋼鐵鍛造的全身盔甲', 500, { defense: 12, hp: 30 }, 5),
  'steel_gauntlets': new Item('steel_gauntlets', '鋼鐵護手', 'armor', '堅固的鋼鐵護手，增強攻擊力', 250, { defense: 5, attack: 3 }, 5),
  'steel_boots': new Item('steel_boots', '鋼鐵靴子', 'armor', '堅固的鋼鐵靴子，提供良好的腿部防護', 300, { defense: 6, agility: -1 }, 5),
  'steel_sword': new Item('steel_sword', '鋼鐵劍', 'weapon', '由高品質鋼鐵鍛造的劍，鋒利耐用', 450, { attack: 15 }, 5)
};

// 添加物品圖片路徑
try {
  const { getItemImagePath } = require('./images');
  
  // 為每個物品添加圖片路徑
  for (const itemId in items) {
    const item = items[itemId];
    item.imagePath = getItemImagePath(item.name);
  }
} catch (error) {
  console.error('加載物品圖片時出錯:', error);
}

// 使用物品
function useItem(player, itemId) {
  const item = items[itemId];
  
  if (!item) {
    return { success: false, message: '物品不存在' };
  }
  
  if (item.type === 'potion') {
    if (item.effects.restore) {
      if (item.effects.restore.hp) {
        const healAmount = item.effects.restore.hp;
        player.hp = Math.min(player.maxHp, player.hp + healAmount);
        return { 
          success: true, 
          message: `使用了 ${item.name}，恢復了 ${healAmount} 點生命值！` 
        };
      }
      
      if (item.effects.restore.mp) {
        const manaAmount = item.effects.restore.mp;
        player.mp = Math.min(player.maxMp, player.mp + manaAmount);
        return { 
          success: true, 
          message: `使用了 ${item.name}，恢復了 ${manaAmount} 點魔力！` 
        };
      }
    }
  }
  
  return { success: false, message: '無法使用此物品' };
}

// 裝備物品
function equipItem(player, itemId) {
  const item = items[itemId];
  
  if (!item) {
    return { success: false, message: '物品不存在' };
  }
  
  // 檢查等級限制
  if (item.levelReq && player.level < item.levelReq) {
    return { 
      success: false, 
      message: `無法裝備 ${item.name}，需要等級 ${item.levelReq} 才能裝備！` 
    };
  }
  
  if (item.type === 'weapon' || item.type === 'armor') {
    // 卸下舊裝備
    if (player.equipment[item.type]) {
      const oldItem = items[player.equipment[item.type]];
      
      // 移除舊裝備的效果
      for (const stat in oldItem.effects) {
        player[stat] -= oldItem.effects[stat];
      }
    }
    
    // 裝備新物品
    player.equipment[item.type] = itemId;
    
    // 添加新裝備的效果
    for (const stat in item.effects) {
      player[stat] = (player[stat] || 0) + item.effects[stat];
    }
    
    return { 
      success: true, 
      message: `裝備了 ${item.name}！` 
    };
  }
  
  return { success: false, message: '無法裝備此物品' };
}

module.exports = { Item, items, useItem, equipItem };