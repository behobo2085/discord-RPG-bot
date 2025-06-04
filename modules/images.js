const path = require('path');
const fs = require('fs');

// 图片根目录
const IMAGE_ROOT = path.join('d:', 'python', 'RPGBOT', 'image');

// 获取物品图片路径
function getItemImagePath(itemName) {
  // 尝试直接匹配物品名称
  const directPath = path.join(IMAGE_ROOT, `${itemName}.png`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // 尝试查找类似名称的图片
  try {
    const files = fs.readdirSync(IMAGE_ROOT);
    const similarFile = files.find(file => {
      // 移除文件扩展名并检查是否包含物品名称
      const fileName = path.basename(file, path.extname(file));
      return fileName.includes(itemName) || itemName.includes(fileName);
    });
    
    if (similarFile) {
      return path.join(IMAGE_ROOT, similarFile);
    }
  } catch (error) {
    console.error('查找物品图片时出错:', error);
  }
  
  // 返回默认图片路径
  return path.join(IMAGE_ROOT, '未知物品.png');
}

// 获取怪物图片路径
function getMonsterImagePath(monsterName) {
  // 尝试直接匹配怪物名称
  const directPath = path.join(IMAGE_ROOT, `${monsterName}.png`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // 尝试查找类似名称的图片
  try {
    const files = fs.readdirSync(IMAGE_ROOT);
    const similarFile = files.find(file => {
      // 移除文件扩展名并检查是否包含怪物名称
      const fileName = path.basename(file, path.extname(file));
      return fileName.includes(monsterName) || monsterName.includes(fileName);
    });
    
    if (similarFile) {
      return path.join(IMAGE_ROOT, similarFile);
    }
  } catch (error) {
    console.error('查找怪物图片时出错:', error);
  }
  
  // 返回默认图片路径
  return path.join(IMAGE_ROOT, '未知怪物.png');
}

// 获取职业图片路径
function getClassImagePath(className) {
  const classNameMap = {
    'warrior': '戰士',
    'mage': '法師',
    'archer': '弓箭手'
  };
  
  const localizedName = classNameMap[className] || className;
  
  // 尝试直接匹配职业名称
  const directPath = path.join(IMAGE_ROOT, `${localizedName}.png`);
  if (fs.existsSync(directPath)) {
    return directPath;
  }
  
  // 尝试查找类似名称的图片
  try {
    const files = fs.readdirSync(IMAGE_ROOT);
    const similarFile = files.find(file => {
      // 移除文件扩展名并检查是否包含职业名称
      const fileName = path.basename(file, path.extname(file));
      return fileName.includes(localizedName) || localizedName.includes(fileName);
    });
    
    if (similarFile) {
      return path.join(IMAGE_ROOT, similarFile);
    }
  } catch (error) {
    console.error('查找职业图片时出错:', error);
  }
  
  // 返回默认图片路径
  return null;
}

// 获取所有物品图片
function getAllItemImages() {
  const itemImages = {};
  
  try {
    const files = fs.readdirSync(IMAGE_ROOT);
    
    // 过滤出可能的物品图片
    files.forEach(file => {
      const fileName = path.basename(file, path.extname(file));
      // 简单的启发式方法：假设物品名称通常较短
      if (fileName.length < 15 && path.extname(file).toLowerCase() === '.png') {
        itemImages[fileName] = path.join(IMAGE_ROOT, file);
      }
    });
  } catch (error) {
    console.error('获取所有物品图片时出错:', error);
  }
  
  return itemImages;
}

module.exports = {
  getItemImagePath,
  getMonsterImagePath,
  getClassImagePath,
  getAllItemImages,
  IMAGE_ROOT
};