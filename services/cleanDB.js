const cron = require('node-cron');
const db = require('../data/bin/db');



function startCleanupTask() {
  cron.schedule('0 * * * *', () => {
    console.log('очистка кодов');

    const now = new Date().toISOString();
    db.run(
      `UPDATE users 
       SET verification_code = NULL, code_expires_at = NULL 
       WHERE is_verified = 0 AND code_expires_at < ?`,
      [now],
      function(err) {
        if (err) {
          console.error('Ошибка при очистке кодов:', err.message);
        } else {
          console.log(`Очистка завершена. Затронуто строк: ${this.changes}`);
        }
      }
    );
  });
}

module.exports = { startCleanupTask };