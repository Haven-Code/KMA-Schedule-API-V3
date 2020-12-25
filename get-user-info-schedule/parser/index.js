const xlsx = require('node-xlsx').default;
const fs = require('fs');
const timer = require("./timer");

function mutiplyFindIndex(parseData, arrayValue) {

    return arrayValue.map(e => parseData[0].findIndex(element => element && element.toLowerCase() == e))
}

function validateWorkSheet(workSheet) {
    try {
        return workSheet[0][0].toUpperCase() == "BAN CƠ YẾU CHÍNH PHỦ" && workSheet[1][0].toUpperCase() == "HỌC VIỆN KỸ THUẬT MẬT MÃ" && !!workSheet[5][5] && !!workSheet[5][2];
    }
    catch (e) {
        return false;
    }

}

function getStudentCode(workSheet) {

    return workSheet[5][5];
}

function getStudentName(workSheet) {

    return workSheet[5][2];
}
module.exports = function (excelBuffer) {
    try {

        let workSheetsFromFile = xlsx.parse(excelBuffer)[0].data;
        if (!validateWorkSheet(workSheetsFromFile)) return Promise.reject(Error("Không phải thời khóa biểu học viện mật mã"));
        let studentCode = getStudentCode(workSheetsFromFile);
        let studentName = getStudentName(workSheetsFromFile);
        let parseData = workSheetsFromFile.filter((e, i) => e[0] && (!!parseInt(e[0]) || e[0].toLowerCase() == "thứ"));

        let [dateIndex, subjectCodeIndex, subjectNameIndex, classNameIndex, teacherIndex, lessonIndex, roomIndex, timeIndex] = mutiplyFindIndex(parseData, ["thứ", "mã học phần", "tên học phần", "lớp học phần", "cbgd", "tiết học", "phòng học", "thời gian học"]);
        let Schedule = new Array();
        parseData.filter((e, i) => i > 0).forEach(e => {
            let [timeStart, timeEnd] = e[timeIndex].split("-");
            timer.findAllDate(e[dateIndex], timeStart, timeEnd).forEach(element => {
                Schedule.push({
                    day: timer.timeStampToDateString(element),
                    // date: e[dateIndex],
                    subjectCode: e[subjectCodeIndex],
                    subjectName: e[subjectNameIndex],
                    className: e[classNameIndex],
                    teacher: e[teacherIndex],
                    lesson: e[lessonIndex],
                    room: e[roomIndex],
                    // time: e[timeIndex]
                })
            })
        })
        let scheduleData = Schedule.sort(function (a, b) {
            return timer.dateStringToTimeStamp(a.day) - timer.dateStringToTimeStamp(b.day);
        })
        // .map(e => Object.values(e));


        // scheduleData.unshift(["Ngày", "Mã học phần", "Tên học phần", "Lớp học phần", "Giảng viên", "Tiết", "Phòng"]);
        // scheduleData.unshift([null, null, null, null, null, null, "Trần Đức Cường"])
        // scheduleData.unshift(["TOOL CONVERT SCHEDULE KMA"])
        // scheduleData.push([""])
        // scheduleData.push([null, null, null, null, null, null, "Thanks you for use."])
        // let buffer = xlsx.build([{ name: "sheet1", data: scheduleData }], { '!merges': [{ s: { c: 0, r: 0 }, e: { c: 6, r: 0 } }] });
        // fs.writeFileS'.ync(/thoi-khoa-bieu-theo-ngay.xlsx', buffer);
        return Promise.resolve({ studentCode, studentName, scheduleData });

    } catch (error) {
        return Promise.reject(error);
    }

}