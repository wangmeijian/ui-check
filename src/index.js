const puppeteer = require('puppeteer');
const fs = require('fs');
const url = require('url');
const { PNG } = require('pngjs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const { log } = require('./utils');

class UiCheck{
	constructor(config){
		const options = {
			beforeTest: () => {},
			router: {
				'/': 'base'
			},
			headless: true,
			pagesize: {
				width: 1366,
				height: 768
			},
			screenshot: path.resolve(
				process.cwd(), './ui-check'
			),
			...config
    }
    
    this.base = options.base;
    this.currentRouter = options.base;
		this.router = {
			...options.router,
			[this.base]: options.router[ this.base ] || 'base'
		};
		this.screenshotPath = path.resolve(options.screenshot);
		this.headless = !!options.headless;
    this.pagesize = options.pagesize;
    
    if (!this.valid()) return false;

		try{
      // 用于登录、初始化页面数据等
      this.beforeTest = async (page) => {
        await options.beforeTest(page);
        await page.waitFor(1000);
      }
      this.updateFilename(this.screenshotPath);
      this.run();
    }catch(error){
      log(error, "red");
			process.exit();
    }
	}
	valid(){
		if(!this.base){
			log(`Invalid parameters base: string value expected`, 'red');
			return false;
		}
		return true;
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
	async screenshot(){
    let name = this.router[this.currentRouter];
    
    if(!name)return;
		name += '.png';
    log(`截图 => ${name}`);
    try{
      await this.page.screenshot({
        path: path.resolve(this.screenshotPath, name),
        fullPage: true
      });
    }catch(error){
      log(error, "red");
			process.exit();
    }
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
		    const diff = new PNG({width: preImage.width, height: preImage.height});		 
		    const numDiffPixels = pixelmatch(preImage.data, curImage.data, diff.data, preImage.width, preImage.height, {threshold: 0.1});
		    
		 	if(numDiffPixels > 0){
		 		let diffImgName = curImg.match(/[^\/]+(?=\.png)/)[0]+'.diff.png';
		 		log( `${curImg.match(/[^\/]+\.png$/)[0]}和上一次渲染不一致，差异像素${numDiffPixels}个，详情查看 => ${diffImgName}`, 'red' );
		 		diff
					.pack()
					.pipe(
						fs.createWriteStream(
							path.resolve(_this.screenshotPath, diffImgName)
						)
					);
		 	}			    
		    fs.unlinkSync(preImg);
		}
	}
	async processAsync(router){
    const urls = Object.keys(router);
    const pageUrl = url.resolve(this.base, urls[0]);
    const wait = this.page.waitForNavigation();

    this.currentRouter = urls[0];
    await this.page.goto(pageUrl);
    await wait;
    await this.page.waitFor(1000);
    if (Object.keys(router).length > 1) {
      delete router[urls[0]];
			await this.processAsync(router);
		}
	}
	async getPageName(){
		return await this.router[new url.URL(this.page.url()).pathname];
	}
	createDirectory(){
		const path = this.screenshotPath;

		if(!fs.existsSync(path)){
			fs.mkdirSync(path, '0777')
		}
	}
	async run(){
		const { router, headless } = this;
		const _this = this;
    const browser = await puppeteer.launch({
      headless
    });
    const page = await browser.newPage();
    const waitForNavigation = page.waitForNavigation();
    const diff = async (path) => {
      if (fs.existsSync(path)) {
        fs.readdirSync(path).forEach(async function(file) {
          if(!/_pre\.png$/.test(file))return;
          let prePath = `${path}/${file}`;
          let curPath = `${path}/${file.replace(/_pre\.png$/, '.png')}`;
          if(!fs.existsSync(curPath))return;
          await _this.imageDiff(prePath, curPath);
        });
      }
    }

    this.browser = browser;
    this.page = page;

    page.on("error", () => {
      log(`${this.getPageName(page)}：${page.url()} => 崩溃了！`, "red");
    });
    page.on("load", async () => {
      await this.screenshot();
    });
    page.on('requestfailed', (request) => {
      let errorText = request.failure().errorText;
      // 页面跳转会取消请求，黄色提示即可
      log(`${this.getPageName(page)}：${request.url()} => 请求异常！${errorText}`, errorText === 'net::ERR_ABORTED' ? 'yellow' : 'red');
    })
    page.on('pageerror', error => {
      log(`${this.getPageName(page)}：${page.url()} => JS异常！${error}`, 'red');
    })

    this.createDirectory();
    await page.setViewport(this.pagesize);
		await page.goto(this.base);
		await waitForNavigation;
    await this.beforeTest(page);
    delete router[this.base];
    await this.processAsync(router);
    await page.waitFor(1000);

    log(`截图完毕！存放目录：${this.screenshotPath}`);
    await browser.close();
    // 图片比对
    await diff(this.screenshotPath);
	}
}

module.exports = UiCheck;