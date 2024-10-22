class Logger {
    static info(...args) {
      console.log(...args);
    }
  
    static error(...args) {
      console.error(...args);
    }
  
    static warn(...args) {
      console.warn(...args);
    }
  
    static debug(...args) {
      if (process.env.NODE_ENV === 'development') {
        console.debug(...args);
      }
    }
  }
  
  module.exports = Logger;