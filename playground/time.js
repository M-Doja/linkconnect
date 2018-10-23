// Jan 1, 1970 00:00:00
var moment = require('moment');

// Return a timetstamp
var tStamp = moment().valueOf();
console.log(tStamp);

var date = moment();
console.log(date.format(`h:mm a`));
