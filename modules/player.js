// 這裡應該實現玩家資料的儲存和讀取
// 可以使用 JSON 檔案或資料庫

// 玩家類別
class Player {
  constructor(id, name, playerClass) {
    this.id = id;
    this.name = name;
    this.class = playerClass;
    this.level = 1;
    this.exp = 0;
    this.gold = 100;
    this.inventory = {};
    this.equipment = {};
    this.inBattle = false;
    
    // 添加資源相關屬性
    this.resources = {
      crops: 0,      // 農作物
      ores: 0,       // 礦石
      fish: 0,       // 魚
      wood: 0,       // 木材
      herbs: 0       // 藥草
    };
    
    // 添加生產技能等級
    this.skills = {
      farming: 1,    // 農業
      mining: 1,     // 採礦
      fishing: 1,    // 釣魚
      crafting: 1    // 製作
    };
    
    // 添加生產冷卻時間
    this.cooldowns = {
      farming: 0,
      mining: 0,
      fishing: 0
    };
    
    // 根據職業設置初始屬性
    this.setInitialStats();
  }
  
  setInitialStats() {
    switch (this.class) {
      case 'warrior':
        this.hp = 150;
        this.maxHp = 150;
        this.mp = 30;
        this.maxMp = 30;
        this.attack = 15;
        this.defense = 10;
        break;
      case 'mage':
        this.hp = 80;
        this.maxHp = 80;
        this.mp = 100;
        this.maxMp = 100;
        this.attack = 8;
        this.defense = 5;
        this.magic = 15;
        break;
      case 'archer':
        this.hp = 100;
        this.maxHp = 100;
        this.mp = 50;
        this.maxMp = 50;
        this.attack = 12;
        this.defense = 7;
        this.agility = 15;
        break;
    }
  }
  
  gainExp(amount) {
    this.exp += amount;
    
    // 檢查是否升級
    const expNeeded = this.level * 100;
    if (this.exp >= expNeeded) {
      this.levelUp();
      return true;
    }
    
    return false;
  }
  
  levelUp() {
    this.level++;
    this.exp = 0;
    
    // 增加屬性
    this.maxHp += 10;
    this.hp = this.maxHp;
    this.maxMp += 5;
    this.mp = this.maxMp;
    
    switch (this.class) {
      case 'warrior':
        this.attack += 3;
        this.defense += 2;
        break;
      case 'mage':
        this.magic += 3;
        this.mp += 10;
        break;
      case 'archer':
        this.attack += 2;
        this.agility += 2;
        break;
    }
  }
}

module.exports = { Player };