const chalk = require('chalk');

class Logger {
  static info(message, ...args) {
    console.log(chalk.blue('[INFO]'), message, ...args);
  }

  static success(message, ...args) {
    console.log(chalk.green('[SUCCESS]'), message, ...args);
  }

  static warn(message, ...args) {
    console.log(chalk.yellow('[WARN]'), message, ...args);
  }

  static error(message, ...args) {
    console.log(chalk.red('[ERROR]'), message, ...args);
  }

  static debug(message, ...args) {
    if (process.env.NODE_ENV === 'development') {
      console.log(chalk.gray('[DEBUG]'), message, ...args);
    }
  }
}

module.exports = Logger;
