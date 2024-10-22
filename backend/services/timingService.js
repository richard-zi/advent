class TimingService {
    static startDay = new Date("2024-10-01"); //Abändern zu 1. Dez. in prod
  
    static addDays(date, days) {
      const newDate = new Date(date.valueOf());
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }
  
    static dateCheck(index) {
      const today = new Date();
      const referenceDay = this.addDays(this.startDay, index - 1);
      
      today.setHours(0, 0, 0, 0);
      referenceDay.setHours(0, 0, 0, 0);
      
      return today >= referenceDay;
    }
  }
  
  module.exports = TimingService;