// 引入怪物模組
const { Monster } = require('./mobs');


// 戰鬥類別
class Battle {
  constructor(player, monster) {
    this.player = player;
    this.monster = monster;
    this.turns = 0;
    this.log = [];
  }
  
  // 玩家攻擊
  playerAttack() {
    const damage = Math.max(1, this.player.attack - this.monster.defense / 2);
    this.monster.hp -= damage;
    this.log.push(`${this.player.name} 對 ${this.monster.name} 造成了 ${damage} 點傷害！`);
    
    return damage;
  }
  
  // 怪物攻擊
  monsterAttack() {
    const damage = Math.max(1, this.monster.attack - this.player.defense / 2);
    this.player.hp -= damage;
    this.log.push(`${this.monster.name} 對 ${this.player.name} 造成了 ${damage} 點傷害！`);
    
    return damage;
  }
  
  // 使用技能
  useSkill(skillName) {
    let result = false;
    
    switch (skillName) {
      case 'fireball':
        if (this.player.mp >= 10) {
          const damage = this.player.magic * 2 || this.player.attack * 1.5;
          this.monster.hp -= damage;
          this.player.mp -= 10;
          this.log.push(`${this.player.name} 使用火球術對 ${this.monster.name} 造成了 ${damage} 點魔法傷害！`);
          result = true;
        } else {
          this.log.push(`魔力不足，無法使用火球術！`);
        }
        break;
      case 'heal':
        if (this.player.mp >= 15) {
          const healAmount = this.player.magic || this.player.level * 10;
          this.player.hp = Math.min(this.player.maxHp, this.player.hp + healAmount);
          this.player.mp -= 15;
          this.log.push(`${this.player.name} 使用治療術恢復了 ${healAmount} 點生命值！`);
          result = true;
        } else {
          this.log.push(`魔力不足，無法使用治療術！`);
        }
        break;
    }
    
    return result;
  }
  
  // 檢查戰鬥是否結束
  isOver() {
    return this.player.hp <= 0 || this.monster.hp <= 0;
  }
  
  // 獲取戰鬥結果
  getResult() {
    if (this.monster.hp <= 0) {
      return {
        winner: 'player',
        expGained: this.monster.expReward,
        goldGained: this.monster.goldReward
      };
    } else if (this.player.hp <= 0) {
      return {
        winner: 'monster'
      };
    }
    
    return null;
  }
}

// 引入怪物生成函數
const { generateMonster } = require('./mobs');

module.exports = { Monster, Battle, generateMonster };