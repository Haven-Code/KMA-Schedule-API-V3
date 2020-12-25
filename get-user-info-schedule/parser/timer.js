const moment = require("moment");
const aDayToTimeStamp = 24 * 60 * 60;
module.exports = {
    dateStringToTimeStamp: function (dateString) {
        return moment(dateString, "DD/MM/YYYY").unix()
    },
    timeStampToDateString: function (timeStamp) {
        return moment.unix(timeStamp).format("DD/MM/YYYY")
    },
    findDayOfWeek: function (timeStamp) {
        return moment.unix(timeStamp).day() + 1
    },
    findAllDate: function (dayOfWeek, timeStart, timeEnd) {
        let timeStampStart = this.dateStringToTimeStamp(timeStart),
            timeStampEnd = this.dateStringToTimeStamp(timeEnd);
        let timeLine = timeStampStart;
        let allDate = new Array();
        while (timeLine <= timeStampEnd) {
            if (this.findDayOfWeek(timeLine) == dayOfWeek) {
                allDate.push(timeLine)
                timeLine += 7 * aDayToTimeStamp;

            }
            else {
                timeLine += 1 * aDayToTimeStamp;
            }
        }

        return allDate;
    }
}