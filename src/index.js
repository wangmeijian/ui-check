const puppeteer = require("puppeteer");
const fs = require("fs");
const url = require("url");
const { PNG } = require("pngjs");
const path = require("path");
const pixelmatch = require("pixelmatch");
const { log } = require("./utils");

class UiCheck {
	constructor(config) {
		if (!this.validator(config)) return false;

		const options = {
			beforeTest: () => {},
			router: {
				"/": "base"
			},
			headless: true,
			pagesize: {
				width: 1366,
				height: 768
			},
			screenshot: path.resolve(process.cwd(), "./ui-check"),
			...config
		};

		this.router = {
			...options.router
		};
		this.base = options.base;
		this.currentRouter = options.base;
		this.screenshotPath = path.resolve(options.screenshot);
		this.headless = !!options.headless;
		this.pagesize = options.pagesize;

		try {
			// 用于登录、初始化页面数据等
			this.beforeTest = async page => {
				await options.beforeTest(page);
				await page.waitFor(1000);
			};
			this.updateFilename(this.screenshotPath);
			this.run();
		} catch (error) {
			log.error(error);
			process.exit();
		}
	}
	validator(config) {
		if (!config.base) {
			log.error(`Invalid parameters base: string value expected`);
			return;
    }
    if (Object.keys(this.router).length === 0) {
      log.error(`Invalid parameters router: router is required`);
      return;
    };
		return true;
	}
	async screenshot() {
		let name = this.router[this.currentRouter];
		if (!name) return;
		name += ".png";
		log.success(`截图 => ${name}`);
		try {
			await this.page.screenshot({
				path: path.resolve(this.screenshotPath, name),
				fullPage: true
			});
		} catch (error) {
			log.error(error);
			process.exit();
		}
	}
	updateFilename(path) {
		if (fs.existsSync(path)) {
			fs.readdirSync(path).forEach(function(file) {
				let curPath = `${path}/${file}`;
				let newPath = `${path}/${file.replace(/\.png$/, "_pre.png")}`;

				if (/\.diff\.png$/.test(file)) {
					fs.unlinkSync(curPath);
					return;
				}
				if (/_pre\.png$/.test(file)) return;
				fs.renameSync(curPath, newPath);
			});
		}
	}
	imageDiff(preImg, curImg) {
		let filesRead = 0;
		const _this = this;
		const preImage = fs
			.createReadStream(preImg)
			.pipe(new PNG())
			.on("parsed", doneReading);
		const curImage = fs
			.createReadStream(curImg)
			.pipe(new PNG())
			.on("parsed", doneReading);

		function doneReading() {
			if (++filesRead < 2) return;
			const diff = new PNG({ width: preImage.width, height: preImage.height });
			const numDiffPixels = pixelmatch(
				preImage.data,
				curImage.data,
				diff.data,
				preImage.width,
				preImage.height,
				{ threshold: 0.1 }
			);

			if (numDiffPixels > 0) {
				let diffImgName = curImg.match(/[^\/]+(?=\.png)/)[0] + ".diff.png";
				log.error(
					`${
						curImg.match(/[^\/]+\.png$/)[0]
					}和上一次渲染不一致，差异像素${numDiffPixels}个，详情查看 => ${diffImgName}`
				);
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
	async processAsync(router) {
		const urls = Object.keys(router);
		const pageUrl = url.resolve(this.base, urls[0]);
		const wait = this.page.waitForNavigation();

		this.currentRouter = urls[0];
		await this.page.goto(pageUrl);
		await wait;
		await this.screenshot();
		if (Object.keys(router).length > 1) {
			delete router[urls[0]];
			await this.processAsync(router);
		}
	}
	async getPageName() {
		return await this.router[new url.URL(this.page.url()).pathname];
	}
	createDirectory() {
		const path = this.screenshotPath;

		if (!fs.existsSync(path)) {
			fs.mkdirSync(path, "0777");
		}
	}
	async run() {
		const { router, headless } = this;
		const _this = this;
		const browser = await puppeteer.launch({
			// for window
			// https://github.com/puppeteer/puppeteer/blob/master/docs/troubleshooting.md
			ignoreDefaultArgs: ["--disable-extensions"],
			// for linux
			args: ["--no-sandbox", "--disable-setuid-sandbox"],
			headless
		});
		const page = await browser.newPage();
		const waitForNavigation = page.waitForNavigation();
		const diff = async path => {
			if (fs.existsSync(path)) {
				fs.readdirSync(path).forEach(async function(file) {
					if (!/_pre\.png$/.test(file)) return;
					let prePath = `${path}/${file}`;
					let curPath = `${path}/${file.replace(/_pre\.png$/, ".png")}`;
					if (!fs.existsSync(curPath)) return;
					await _this.imageDiff(prePath, curPath);
				});
			}
		};

		this.browser = browser;
		this.page = page;

		page.on("error", () => {
			log.error(`${this.getPageName(page)}：${page.url()} => 崩溃了！`);
		});
		page.on("requestfailed", request => {
			let errorText = request.failure().errorText;
			if (errorText !== "net::ERR_ABORTED") {
				log.error(
					`${this.getPageName(
						page
					)}：${request.url()} => 请求异常！${errorText}`
				);
			}
		});
		page.on("pageerror", error => {
			log.error(`${this.getPageName(page)}：${page.url()} => JS异常！${error}`);
		});

		this.createDirectory();
		await page.setViewport(this.pagesize);
		await page.goto(this.base);
		await waitForNavigation;
		await this.beforeTest(page);
		await this.processAsync(router);
		await page.waitFor(1000);

		log.success(`截图完毕！存放目录：${this.screenshotPath}`);
		await browser.close();
		// 图片比对
		await diff(this.screenshotPath);
	}
}

module.exports = UiCheck;
