# ui-check

基于 puppeteer 的 UI 测试工具

利用 Chromium 浏览器环境自动化访问页面并截图、对比，监听页面崩溃、JS 异常、请求异常行为

## 用法

```js
npm install ui-check -g
```

新建配置文件 config.js

```js
module.exports = {
  // 根路径
  base: "https://www.baidu.com/",
  // 路由
  router: {
    "/s?wd=a": "page a",
    "/s?wd=b": "page b"
  }
}
```

执行

```
ui-check --config config.js
```

## 常见问题
Linux系统上使用chromium可能需要安装依赖
```
sudo yum install -y pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64 libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64 libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64 alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 ipa-gothic-fonts xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc
```

## 说明
首次执行，输出日志：

```
 17:07:09  截图 => page a.png
 17:07:13  截图 => page b.png
 17:07:13  截图完毕！存放目录：/Users/xxx/ui-check
```

第二次执行`ui-check --config config.js`，生成的图片会跟上一次生成的结果对比，两次渲染结果不一致时，会将两张图片合成一张`.diff.png`后缀的图片，差异点以红色像素标注，一目了然

输出日志：

```
 17:09:39  截图 => page a.png
 17:09:43  截图 => page b.png
 17:09:43  截图完毕！存放目录：/Users/xxx/ui-check
 17:09:45  page b.png和上一次渲染不一致，差异像素7470个，详情查看 => page b.diff.png
```

如下图  
<img src="https://github.com/360hnjd-fe/ui-check/raw/master/example.png" width="800" />

## API

```js
module.exports = {
  // 根路径
  base: "",
  // 路由
  router: {},
  // 截图存放路径，默认为./ui-check
  screenshot: "",
  // 页面分辨率，默认为1366*768
  pagesize: {
    width: 1366,
    height: 768
  },
  // 是否无界面，默认为true（不显示Chromium界面）
  headless: true,
  // 需要登录等操作，在这里实现
  // beforeTest内做异步操作，需使用async await
  // page即当前页面对象，API：https://github.com/GoogleChrome/puppeteer/blob/v1.10.0/docs/api.md#class-page
  beforeTest: async page => {
    // await page.type('#user', 'admin')
    // await page.type('#password', '123456')
    // await page.click('#login');
    // // 或者直接设置cookie
    // await page.setCookie({
    //   name: 'token',
    //   value: 'xxxxxx'
    // })
  }
};
```

## TODO

- 做成 cli 工具一键执行
- 增加自动识别路由（支持 Vue、React）
- 增加 exclude 配置，排除部分路由
