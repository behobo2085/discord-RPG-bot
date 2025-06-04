const { REST, Routes } = require('discord.js');
const { clientId, guildId, token } = require('./config.json');

// 定義指令
const commands = [
  {
    name: 'rpg',
    description: '開始 RPG 遊戲',
  }
];

// 準備註冊指令的 REST 模組
const rest = new REST({ version: '10' }).setToken(token);

// 註冊指令
(async () => {
  try {
    console.log('開始註冊斜線指令...');

    await rest.put(
      Routes.applicationGuildCommands(clientId, guildId),
      { body: commands },
    );

    console.log('成功註冊斜線指令！');
  } catch (error) {
    console.error(error);
  }
})();