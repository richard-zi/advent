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
  // WICHTIG: Für die Produktion auf den 1. Dezember setzen
  static startDay = new Date("2024-10-01"); // In Produktion auf "2024-12-01" ändern

  /**
   * Fügt einer Date-Instanz eine bestimmte Anzahl von Tagen hinzu
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
   * @param {number} index - Die Nummer des zu prüfenden Türchens
   * @returns {boolean} True wenn das Türchen geöffnet werden darf
   */
  static dateCheck(index) {
    const today = new Date();
    // Berechne das Referenzdatum für das jeweilige Türchen
    const referenceDay = this.addDays(this.startDay, index - 1);
    
    // Setze die Uhrzeiten auf Mitternacht für einen fairen Vergleich
    today.setHours(0, 0, 0, 0);
    referenceDay.setHours(0, 0, 0, 0);
    
    // Erlaube Zugriff nur wenn das heutige Datum gleich oder später ist
    return today >= referenceDay;
  }
}

module.exports = TimingService;