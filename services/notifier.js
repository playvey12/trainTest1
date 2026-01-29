const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN);
const myId = process.env.TELEGRAM_CHAT_ID;

const notifyRegistration = (username) => {
    const text = `👤 Новый пользователь: **${username}**\n✅ Регистрация прошла успешно!`;
    bot.sendMessage(myId, text, { parse_mode: 'Markdown' })
       .catch(err => console.error('Ошибка уведомления в TG:', err.message));
};

module.exports = { notifyRegistration };