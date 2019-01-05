# ui-check
基于puppeteer的UI测试工具

## 用法
```js
npm install ui-check
```
新建ui-check.js

```js
var UiCheck = require('ui-check');

new UiCheck({
	// 测试网站的根路径
	host: 'https://github.com/',
	// 需要测试的页面路由映射表
	router: {
		'/business': '业务',
		'/trending': '趋势'
	},
	// 截图存放路径
	screenshotPath: './',
	// 页面窗口大小
	pagesize: {
		width: 1400,
		height: 960
	},
	// 测试前初始化数据，登录什么的
	beforeTest: (page) => {
		return new Promise(async (resolve) => {
			// ...
			resolve();
		})
	}
})
```
执行

```
node ui-check.js
```

输出日志：

```
2019-1-5 19:24:08: 截图 => 业务.png 
2019-1-5 19:24:13: 截图 => 趋势.png 
2019-1-5 19:24:13: 截图完毕！存放目录：./ 
```

每次执行node ui-check.js，生成的图片会跟上一次生成的结果对比，两次渲染结果不一致时，会将两张图片生成以```.diff.png```后缀的图片供查看
