const axios = require("axios").default;
const cheerio = require("cheerio");
const utils = require('./utils');
const qs = require('query-string')
const parser = require("./parser");

module.exports = async (cookieJar, drpSemester) => {

	axios.defaults.jar = cookieJar;
	axios.defaults.withCredentials = true;
	axios.defaults.crossdomain = true;

	let url = `http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Reports/Form/StudentTimeTable.aspx`

	try {
		let res = await axios.get(url)

		const $ = cheerio.load(res.data)
		const selectorData = utils.parseSelector($);
		const initialFormData = utils.parseInitialFormData($);
		selectorData.drpTerm = 1;
		selectorData.drpSemester = drpSemester || selectorData.drpSemester;
		selectorData.drpType = 'B';
		selectorData.btnView = "Xuất file Excel";

		let formData = {
			...initialFormData,
			...selectorData
		}

		//console.log(formData)

		let file = await axios.post(url, qs.stringify(formData), {
			responseType: 'arraybuffer',
			headers: {
				"User-Agent": "Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/76.0.114 Chrome/70.0.3538.114 Safari/537.36",
				"Content-Type": "application/x-www-form-urlencoded",
				"Accept": "text/html,application/xhtml+xml,application/xml,application/vnd.ms-excel;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9"
			},
		})

		let { scheduleData } = await parser(file.data)

		let re = {
			code: 200,
			message: 'Thành Công',
			data: scheduleData
		}

		return Promise.resolve(re)
	} catch (err) {
		let re = {
			code: 400,
			message: err
		}

		return Promise.reject(re)
	}
}