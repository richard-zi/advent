/**
 * @fileoverview /backend/services/timingService.js
 * Timing Service
 * 
 * Verwaltet die zeitliche Steuerung des Adventskalenders.
 * Bestimmt, wann welche Türchen geöffnet werden können.
 */

class TimingService {
    // Startdatum des Adventskalenders
    static startDay = new Date("2024-10-01"); // In Produktion auf "2024-12-01" ändern
  
    /**
     * Fügt einer Date-Instanz Tage hinzu
     * @param {Date} date - Das Ausgangsdatum
     * @param {number} days - Anzahl der hinzuzufügenden Tage
     * @returns {Date} Das neue Datum
     */
    static addDays(date, days) {
      const newDate = new Date(date.valueOf());
      newDate.setDate(newDate.getDate() + days);
      return newDate;
    }
  
    /**
     * Prüft ob ein bestimmtes Türchen bereits geöffnet werden darf
     * @param {number} index - Die Nummer des Türchens
     * @returns {boolean} True wenn das Türchen geöffnet werden darf
     */
    static dateCheck(index) {
      const today = new Date();
      const referenceDay = this.addDays(this.startDay, index - 1);
      
      today.setHours(0, 0, 0, 0);
      referenceDay.setHours(0, 0, 0, 0);
      
      return today >= referenceDay;
    }
  }
  
  module.exports = TimingService;