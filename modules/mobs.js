const path = require('path');
const fs = require('fs');

// 怪物類別
class Monster {
  constructor(name, level) {
    this.name = name;
    this.level = level;
    this.hp = level * 20 + 30;
    this.maxHp = this.hp;
    this.attack = level * 5 + 5;
    this.defense = level * 2 + 2;
    this.expReward = level * 15;
    this.goldReward = level * 10;
    
    // 添加兼容性屬性
    this.exp = this.expReward;
    this.gold = this.goldReward;
    
    // 添加怪物圖片
    try {
      const { getMonsterImagePath } = require('./images');
      this.imagePath = getMonsterImagePath(this.name);
    } catch (error) {
      console.error('加載怪物圖片時出錯:', error);
    }
  }
}

// 定義遊戲地圖區域
const gameAreas = [
  {
    id: 'forest',
    name: '初心者森林',
    description: '一片寧靜的森林，適合初學者冒險。這裡的怪物相對弱小，是新手冒險者的理想訓練場所。',
    minLevel: 1,
    maxLevel: 5,
    monsters: [
      { name: '史萊姆', baseHp: 20, baseAttack: 5, baseDefense: 2, baseExp: 10, baseGold: 5 },
      { name: '小哥布林', baseHp: 25, baseAttack: 6, baseDefense: 1, baseExp: 12, baseGold: 8 },
      { name: '蝙蝠', baseHp: 15, baseAttack: 4, baseDefense: 0, baseExp: 8, baseGold: 3 },
      { name: '老鼠', baseHp: 12, baseAttack: 3, baseDefense: 0, baseExp: 5, baseGold: 2 },
      { name: '小蜥蜴', baseHp: 18, baseAttack: 5, baseDefense: 1, baseExp: 9, baseGold: 4 }
    ]
  },
  {
    id: 'cave',
    name: '神秘洞窟',
    description: '一個充滿未知的洞窟，裡面棲息著各種中等強度的怪物。需要一定的實力才能在此生存。',
    minLevel: 4,
    maxLevel: 8,
    monsters: [
      { name: '大史萊姆', baseHp: 40, baseAttack: 10, baseDefense: 5, baseExp: 20, baseGold: 15 },
      { name: '哥布林戰士', baseHp: 45, baseAttack: 12, baseDefense: 4, baseExp: 25, baseGold: 18 },
      { name: '骷髏兵', baseHp: 35, baseAttack: 15, baseDefense: 2, baseExp: 22, baseGold: 16 },
      { name: '狼', baseHp: 38, baseAttack: 14, baseDefense: 3, baseExp: 23, baseGold: 17 },
      { name: '蜥蜴人', baseHp: 42, baseAttack: 11, baseDefense: 6, baseExp: 24, baseGold: 19 }
    ]
  },
  {
    id: 'mountain',
    name: '危險山脈',
    description: '高聳的山脈，棲息著強大的怪物。只有經驗豐富的冒險者才敢挑戰這裡的危險。',
    minLevel: 7,
    maxLevel: 12,
    monsters: [
      { name: '金屬史萊姆', baseHp: 60, baseAttack: 18, baseDefense: 12, baseExp: 40, baseGold: 35 },
      { name: '哥布林首領', baseHp: 70, baseAttack: 20, baseDefense: 8, baseExp: 45, baseGold: 40 },
      { name: '骷髏法師', baseHp: 55, baseAttack: 25, baseDefense: 5, baseExp: 50, baseGold: 45 },
      { name: '狼王', baseHp: 65, baseAttack: 22, baseDefense: 7, baseExp: 48, baseGold: 42 },
      { name: '黑狼王', baseHp: 68, baseAttack: 19, baseDefense: 10, baseExp: 47, baseGold: 38 }
    ]
  },
  {
    id: 'castle',
    name: '遺棄城堡',
    description: '一座古老的廢棄城堡，傳說中棲息著強大的怪物和寶藏。只有最勇敢的冒險者才能征服這裡。',
    minLevel: 10,
    maxLevel: 15,
    monsters: [
      { name: '史萊姆王', baseHp: 100, baseAttack: 30, baseDefense: 20, baseExp: 80, baseGold: 70 },
      { name: '哥布林王', baseHp: 120, baseAttack: 35, baseDefense: 15, baseExp: 90, baseGold: 80 },
      { name: '骷髏王', baseHp: 90, baseAttack: 40, baseDefense: 10, baseExp: 100, baseGold: 90 },
      { name: '三頭狼', baseHp: 110, baseAttack: 38, baseDefense: 12, baseExp: 95, baseGold: 85 },
      { name: '蜥蜴王', baseHp: 115, baseAttack: 32, baseDefense: 18, baseExp: 98, baseGold: 88 }
    ]
  },
  {
    id: 'dragon_lair',
    name: '龍之巢穴',
    description: '傳說中龍族的居所，充滿了致命的危險和豐厚的寶藏。只有最強大的冒險者才能在此生存。',
    minLevel: 15,
    maxLevel: 20,
    monsters: [
      { name: '小龍', baseHp: 150, baseAttack: 45, baseDefense: 25, baseExp: 120, baseGold: 100 },
      { name: '火龍', baseHp: 180, baseAttack: 50, baseDefense: 30, baseExp: 150, baseGold: 130 },
      { name: '冰龍', baseHp: 170, baseAttack: 48, baseDefense: 35, baseExp: 145, baseGold: 125 },
      { name: '雷龍', baseHp: 175, baseAttack: 52, baseDefense: 28, baseExp: 155, baseGold: 135 },
      { name: '遠古巨龍', baseHp: 250, baseAttack: 60, baseDefense: 40, baseExp: 200, baseGold: 180 }
    ]
  }
];

// 根據玩家等級和選擇的區域生成怪物
function generateMonster(playerLevel, areaId = null) {
  // 如果沒有指定區域，根據玩家等級選擇合適的區域
  let area;
  
  if (areaId) {
    area = gameAreas.find(a => a.id === areaId);
    // 如果找不到指定區域或玩家等級不符合要求，選擇適合玩家等級的區域
    if (!area || playerLevel < area.minLevel) {
      area = gameAreas.find(a => playerLevel >= a.minLevel && playerLevel <= a.maxLevel) || gameAreas[0];
    }
  } else {
    // 自動選擇適合玩家等級的區域
    area = gameAreas.find(a => playerLevel >= a.minLevel && playerLevel <= a.maxLevel) || gameAreas[0];
  }
  
  // 從區域的怪物池中隨機選擇一個怪物
  const monsterTemplate = area.monsters[Math.floor(Math.random() * area.monsters.length)];
  
  // 隨機生成怪物等級（玩家等級上下浮動1級，但不超過區域限制）
  const minMonsterLevel = Math.max(area.minLevel, playerLevel - 1);
  const maxMonsterLevel = Math.min(area.maxLevel, playerLevel + 1);
  const monsterLevel = Math.floor(Math.random() * (maxMonsterLevel - minMonsterLevel + 1)) + minMonsterLevel;
  
  // 根據等級調整怪物屬性
  const levelMultiplier = monsterLevel / Math.max(1, playerLevel - 2);
  const hp = Math.floor(monsterTemplate.baseHp * levelMultiplier);
  const attack = Math.floor(monsterTemplate.baseAttack * levelMultiplier);
  const defense = Math.floor(monsterTemplate.baseDefense * levelMultiplier);
  const exp = Math.floor(monsterTemplate.baseExp * levelMultiplier);
  const gold = Math.floor(monsterTemplate.baseGold * levelMultiplier);
  
  // 創建新的怪物實例
  const monster = new Monster(monsterTemplate.name, monsterLevel);
  
  // 手動設置怪物屬性，覆蓋默認計算的值
  monster.hp = hp;
  monster.maxHp = hp;
  monster.attack = attack;
  monster.defense = defense;
  monster.expReward = exp;
  monster.goldReward = gold;
  monster.exp = exp; // 兼容性屬性
  monster.gold = gold; // 兼容性屬性
  monster.area = area.name; // 添加怪物所屬區域信息
  
  return monster;
}

// 獲取所有遊戲區域信息
function getAllAreas() {
  return gameAreas.map(area => ({
    id: area.id,
    name: area.name,
    description: area.description,
    minLevel: area.minLevel,
    maxLevel: area.maxLevel
  }));
}

// 檢查玩家是否可以進入指定區域
function canEnterArea(playerLevel, areaId) {
  const area = gameAreas.find(a => a.id === areaId);
  if (!area) return false;
  return playerLevel >= area.minLevel;
}

// 根據ID獲取地區信息
function getAreaById(areaId) {
  return gameAreas.find(area => area.id === areaId);
}

module.exports = { Monster, generateMonster, getAllAreas, canEnterArea, gameAreas, getAreaById };