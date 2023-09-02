const moment = require('moment-timezone');

const timeUtil = ()=>{
    const timeZone = 'Asia/Kolkata';
    
    const currentTime = moment().tz(timeZone);
    
    return currentTime.format('YYYY-MM-DD_hh-mm-ss-A');
} 

module.exports = timeUtil