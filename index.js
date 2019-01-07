const puppeteer = require('puppeteer');
const fs = require('fs');
const { URL } = require('url');
const { PNG } = require('pngjs');
const path = require('path');
const pixelmatch = require('pixelmatch');

class UiCheck{
	constructor(config){
		this.config = config;
		this.host = config.host;
		this.router = config.router || {};
		this.screenshotPath = config.screenshotPath || path.resolve(
			process.cwd()
		);
		this.headless = typeof config.headless === 'undefined' ? true : config.headless;
		this.pagesize = config.pagesize || {
			width: 1366,
			height: 768
		};
		// 用于登录、初始化页面数据等
		this.beforeTest = async(page) => {
			await config.beforeTest ? config.beforeTest(page) : '';
		}

		if(!this.valid())return false;
		this.updateFilename(this.screenshotPath);
		this.run();
	}
	valid(){
		if(!this.host){
			this.log(`Invalid parameters host: string value expected`, 'red');
			return false;
		}
		return true;
	}
	log(message, color='green'){
		const colors = {
			red: '\x1b[31m ',
			green: '\x1b[32m ',
			yellow: '\x1b[33m '
		}
		console.log(`${colors[color]}${new Date().toLocaleString()}: ${message} \x1b[0m`);
	}
	timeout(delay){
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				try{
					resolve(1);
				}catch(e){
					reject(0);
				}
			}, delay)
		})
	}
	screenshot(name){
		name += '.png';
		this.log(`截图 => ${name}`);
		return this.page.screenshot({
			path: path.resolve(this.screenshotPath, name),
			fullpage: true
		})
	}
	updateFilename(path){
		if (fs.existsSync(path)) {
			fs.readdirSync(path).forEach(function(file) {
				let curPath = `${path}/${file}`;
				let newPath = `${path}/${file.replace(/\.png$/, '_pre.png')}`;

				if(/\.diff\.png$/.test(file)){
					fs.unlinkSync(curPath);
					return;
				}
				if(/_pre\.png$/.test(file))return;
				fs.renameSync(curPath, newPath);
			});
		}
	}
	imageDiff(preImg, curImg){
		let filesRead = 0;
		const _this = this;
		const preImage = fs.createReadStream(preImg).pipe(new PNG()).on('parsed', doneReading);
		const curImage = fs.createReadStream(curImg).pipe(new PNG()).on('parsed', doneReading);
		 
		function doneReading() {
		    if (++filesRead < 2) return;
		    var diff = new PNG({width: preImage.width, height: preImage.height});
		 
		    const numDiffPixels = pixelmatch(preImage.data, curImage.data, diff.data, preImage.width, preImage.height, {threshold: 0.1});
		 	if(numDiffPixels > 0){
		 		let diffImgName = curImg.match(/[^\/]+(?=\.png)/)[0]+'.diff.png';
		 		_this.log( `${curImg.match(/[^\/]+\.png$/)[0]}和上一次渲染不一致，差异像素${numDiffPixels}个，详情查看 => ${diffImgName}`, 'red' );
		 		diff.pack().pipe(fs.createWriteStream(path.resolve(_this.screenshotPath, diffImgName)));
		 	}			    
		    fs.unlinkSync(preImg);
		}
	}
	processAsync(router){
		return new Promise(async (resolve, reject) => {
			try{
				for(let url in router){
					let pageUrl = new URL(this.host);
					pageUrl.pathname = url;
					await this.page.goto(pageUrl.href);
					await this.timeout(2000);
					await this.screenshot(router[url]);
				}
				resolve();
			}catch(err){
				this.log(err, 'red');
				reject(err);
			}
		})
	}
	getPageName(page){
		return this.router[new URL(this.page.url()).pathname];
	}
	async run(){
		const { router, headless, screenshotPath } = this;
		const _this = this;

		try{
			const browser = await puppeteer.launch({
				headless
			});
			const page = await browser.newPage();
			const diff = (path) => {
				return new Promise((resolve, reject) => {
					if (fs.existsSync(path)) {
						fs.readdirSync(path).forEach(async function(file) {
							if(!/_pre\.png$/.test(file))return;
							let prePath = `${path}/${file}`;
							let curPath = `${path}/${file.replace(/_pre\.png$/, '.png')}`;
							if(!fs.existsSync(curPath))return;
							await _this.imageDiff(prePath, curPath);
						});
					}
				})
			}

			this.browser = browser;
			this.page = page;

			page.on('error', () => {
				this.log(`${this.getPageName(page)}：${page.url()} => 崩溃了！`, 'red');
			})
			page.on('requestfailed', (request) => {
				let errorText = request.failure().errorText;
				// 页面跳转会取消请求，黄色提示即可
				this.log(`${this.getPageName(page)}：${request.url()} => 请求异常！${errorText}`, errorText === 'net::ERR_ABORTED' ? 'yellow' : 'red');
			})
			page.on('pageerror', error => {
				this.log(`${this.getPageName(page)}：${page.url()} => JS异常！${error}`, 'red');
			})

			await page.setViewport(this.pagesize);
			await this.beforeTest(page);
			await this.timeout(2000);
			await this.processAsync(router);

			this.log(`截图完毕！存放目录：${screenshotPath}`);
			await browser.close();
			// 图片比对
			await diff(screenshotPath);
		}catch(error){
			this.log(error, 'red');
			return false;
		}
	}
}

module.exports = UiCheck;