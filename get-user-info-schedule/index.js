/** @format */

const axios = require('axios').default
const axiosCookieJarSupport = require('axios-cookiejar-support').default
const tough = require('tough-cookie')
const md5 = require('md5')
const qs = require('query-string')
const cheerio = require('cheerio')

const { parseInitialFormData, parseSelector } = require('./utils')
const listSchedule = require('./schedule')

const loginUrl = 'http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/Login.aspx'
const studentProfileUrl = 'http://qldt.actvn.edu.vn/CMCSoft.IU.Web.Info/StudentProfileNew/HoSoSinhVien.aspx'

axiosCookieJarSupport(axios)
const cookieJar = new tough.CookieJar()

axios.defaults.withCredentials = true
axios.defaults.crossdomain = true
axios.defaults.jar = cookieJar

module.exports = async function (context, req) {
	const username = req.query.username || (req.body && req.body.username)
	const password = req.query.password || (req.body && req.body.password)

	if (!username || !password) {
		return (context.res = {
			body: JSON.stringify({
				code: '400',
				message: 'Missing Item',
			}),
		})
	}

	context.log.info('Login With ID:', username)

	try {
		const loginGet = await axios.get(loginUrl, { withCredentials: true, jar: cookieJar })

		let $ = cheerio.load(loginGet.data)

		const formData = {
			...parseInitialFormData($),
			...parseSelector($),
			txtUserName: username,
			txtPassword: md5(password),
			btnSubmit: 'Đăng nhập',
		}

		const form = qs.stringify(formData)

		const config = {
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/76.0.114 Chrome/70.0.3538.114 Safari/537.36',
				'Content-Type': 'application/x-www-form-urlencoded',
			},
			withCredentials: true,
			jar: cookieJar,
		}

		const loginPost = await axios.post(loginUrl, form, config)

		$ = cheerio.load(loginPost.data)
		const userFullName = $('#PageHeader1_lblUserFullName').text().toLowerCase()
		const wrongPass = $('#lblErrorInfo').text()

		if (wrongPass == 'Bạn đã nhập sai tên hoặc mật khẩu!' || wrongPass == 'Tên đăng nhập không đúng!') {
			return (context.res = {
				body: JSON.stringify({
					code: 401,
					message: 'Wrong Password',
				}),
			})
		}

		if (userFullName == 'khách') {
			return (context.res = {
				body: JSON.stringify({
					code: 403,
					message: 'Please Logn Again !',
				}),
			})
		}

		let schedule = await listSchedule(cookieJar)

		if (schedule.code != 200) {
			context.res = {
				body: JSON.stringify({
					code: 402,
					message: schedule.message,
				}),
			}
		} else {
			const res = await axios.get(studentProfileUrl, { withCredentials: true, jar: cookieJar })

			$ = cheerio.load(res.data)
			const displayName = ($('input[name="txtHoDem"]').val() || '') + ' ' + ($('input[name="txtTen"]').val() || '')
			const studentCode = $('input[name="txtMaSV"]').val() || ''
			const gender = $('select[name="drpGioiTinh"] > option[selected]').text()
			const birthday = $('input[name="txtNgaySinh"]').val() || ''
			const information = {
				displayName,
				studentCode,
				gender,
				birthday,
			}

			context.res = {
				body: JSON.stringify({
					code: 200,
					message: 'OK',
					data: {
						studentInfo: information,
						studentSchedule: schedule.data,
					},
				}),
			}
		}
	} catch (e) {
		context.log.error(e)

		return (context.res = {
			body: JSON.stringify({
				code: '500',
				message: 'Error: ' + e,
			}),
		})
	}
}
