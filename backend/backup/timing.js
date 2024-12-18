// timing.js
const startDay = new Date("2024-10-01") //Abändern zu 1. Dez. in prod

Date.prototype.addDays = function(days) {
    var date = new Date(this.valueOf());
    date.setDate(date.getDate() + days);
    return date;
}

function dateCheck(index){
    today = new Date();
    referenceDay = startDay.addDays(index - 1);
    today.setHours(0, 0, 0, 0);
    referenceDay.setHours(0, 0, 0, 0);
    return today >= referenceDay;
}

module.exports = { dateCheck };