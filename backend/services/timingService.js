/**
 * @fileoverview /backend/services/timingService.js
 * Timing-Service
 * 
 * Dieser Service ist für die zeitliche Steuerung des Adventskalenders zuständig.
 * Er kontrolliert, wann welche Türchen geöffnet werden können und stellt sicher,
 * dass Inhalte erst zum vorgesehenen Zeitpunkt zugänglich sind.
 */

class TimingService {
    // Startdatum des Adventskalenders
    static startDay = new Date("2024-10-28"); // In Produktion auf "2024-12-01" ändern
    static loopAround = 1000; // Führe einen Looparound der Indizierung ein für das einfache Serven von mehreren Mediafiles pro Tag
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
      const referenceDay = this.addDays(this.startDay, index % this.loopAround - 1);
      
      today.setHours(0, 0, 0, 0);
      referenceDay.setHours(0, 0, 0, 0);
      
      return today >= referenceDay;
    }
  }
module.exports = TimingService;