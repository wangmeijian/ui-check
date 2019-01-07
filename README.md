# ui-check
基于puppeteer的UI测试工具

利用Chromium浏览器环境自动化访问页面并截图、对比，监听页面崩溃、JS异常、请求异常

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
    }
})
```
执行

```
node ui-check.js
```

输出日志：

```
2019-1-7 10:56:50: 截图 => 业务.png 
2019-1-7 10:56:55: 截图 => 趋势.png 
2019-1-7 10:56:55: 截图完毕！存放目录：./
```

第二次执行```node ui-check.js```，生成的图片会跟上一次生成的结果对比，两次渲染结果不一致时，会将两张图片合成一张```.diff.png```后缀的图片，差异点以红色像素标出，一目了然

输出日志：

```
2019-1-7 10:57:07: 截图 => 业务.png 
2019-1-7 10:57:12: 截图 => 趋势.png 
2019-1-7 10:57:12: 截图完毕！存放目录：./ 
2019-1-7 10:57:13: 趋势.png和上一次渲染不一致，差异像素1061个，详情查看 => 趋势.diff.png
```

## API

```js
new UiCheck({
    // 是否无界面，默认为true（不显示Chromium）
    headless: true,
    // 测试网站的根路径
    host: '',
    // 需要测试的页面路由映射表
    router: {},
    // 截图存放路径，默认为脚本执行路径
    screenshotPath: '',
    // 页面窗口大小，默认为1366*768
    pagesize: {
        width: 1366,
        height: 768
    },
    // 测试前初始化数据，登录等操作
    // page即当前页面对象，API：https://github.com/GoogleChrome/puppeteer/blob/v1.10.0/docs/api.md#class-page
    // beforeTest必须返回Promise对象
    beforeTest: (page) => {
        return new Promise(async (resolve) => {
            // ...
            resolve();
        })
    }
})
```