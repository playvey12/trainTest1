const TelegramBot = require('node-telegram-bot-api');
const db = require('../data/bin/db');
require('dotenv').config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const myId = String(process.env.TELEGRAM_CHAT_ID || '').trim(); 

const bot = new TelegramBot(token, { polling: true });

console.log('--- Бот-статистика запущен ---');
console.log('Токен (первые 5 симв.):', token ? token.substring(0, 5) : 'НЕТ ТОКЕНА');
console.log('ID админа:', myId);

bot.onText(/\/stat/, (msg) => {
    const chatId = String(msg.chat.id);
    console.log(`[Команда] /stat от ${chatId}`);

    if (chatId !== myId) {
        console.warn(`[ОТКАЗ] Неверный ID: ${chatId}. Ждали: ${myId}`);
        return bot.sendMessage(chatId, `🚫 Доступ запрещен. Ваш ID: ${chatId}`);
    }

   db.get('SELECT COUNT(*) as count FROM users', (err, row) => {
    if (err) {
        console.error('Ошибка БД:', err.message);
        return bot.sendMessage(chatId, "❌ <b>Ошибка базы данных</b>\n<code>" + err.message + "</code>", { parse_mode: 'HTML' });
    }

    const total = row ? row.count : 0;
    const now = new Date();
    

    const dateString = now.toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
    const timeString = now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    const message = [
        `📊 <b>ОТЧЕТ ПО ПОЛЬЗОВАТЕЛЯМ</b>`,
        `────────────────────`,
        `👥 Всего в базе: <code>${total}</code> чел.`,
        `📈 Статус: <b>Активен</b>`,
        `────────────────────`,
        `📅 <i>На дату: ${dateString}</i>`,
        `⏰ <i>Время: ${timeString}</i>`
    ].join('\n');

    bot.sendMessage(chatId, message, { 
        parse_mode: 'HTML',
        disable_notification: false 
    });
});
});


const notifyRegistration = (userInfo) => {
    let text = '';
    
    if (typeof userInfo === 'object') {
        const { first_name, last_name, username, id, total, type } = userInfo;
        
        const header = type === 'registration' 
            ? `🚀 <b>НОВАЯ РЕГИСТРАЦИЯ!</b>` 
            : `🔑 <b>ПОВТОРНЫЙ ВХОД</b>`;

     
        const name = `${first_name || ''} ${last_name || ''}`.replace(/[<>]/g, '');
        const nick = username ? `@${username}` : 'скрыт';

        text = `${header}\n\n` +
               `👤 <b>Имя:</b> ${name}\n` +
               `🔗 <b>Юзер:</b> ${nick}\n` +
               `🆔 <b>ID:</b> <code>${id}</code>`;
        
        if (total) {
            text += `\n📊 <b>Всего в базе:</b> ${total}`;
        }
    } else {
        text = `👤 <b>Новый пользователь:</b> ${userInfo}\n✅ Регистрация успешна!`;
    }


    bot.sendMessage(myId, text, { parse_mode: 'HTML' })
       .then(() => console.log(`Уведомление [${userInfo.type || 'email'}] отправлено админу`))
       .catch(err => console.error('ОШИБКА БОТА НОТИФИКАТОРА:', err.message));
};
module.exports={notifyRegistration}


