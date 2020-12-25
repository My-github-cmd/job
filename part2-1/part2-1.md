### 前端工程化的认识，工程化能解决的问题和带来的价值

* 前端工程化是使用软件工程的技术和方法来进行前端的开发流程、技术、工具、经验等规范化、标准化，其主要目的为了提高效率和降低成本，即提高开发过程中的开发效率，减少不必要的重复工作时间
* 解决传统语言或者语法的弊端；无法使用模块化和组件化；重复的机械工作；代码风格统一/质量保证；依赖后端服务接口支持；整体依赖项目; 

### 脚手架除了创建项目结构，还有什么较深的意义？

* 脚手架可以帮我们快速生成项目，创建项目基础结构。不仅是创建项目基础结构，更重要的是给开发者提供一种约束和规范，例如：相同的组织结构，相同的代码开发范式、相同的模块依赖、相同的工具配置，相同的基础代码。更加利于代码维护与团队开发

### nodejs自定义一个小型的脚手架工具

* 创建目录：cli-demo
* 创建package.json

``` js
 yarn init--yes
```

* 在package.json中添加bin属性，指定cli入口文件

``` js
{
    name: 'cli-demo',
    version: '1.0.0',
    bin: 'cli.js',
    main: 'index.js',
    licese: 'MIT'
}
```

* 安装依赖

``` js
yarn add inquirer // 询问
yarn add ejs // 添加模板引擎
```

* 创建cli.js

``` js
#!/usr/bin/env node  // NODE CLI 应用入口文件必须要有这样的文件名

/**
 * 脚手架的工作流程
 * 1、通过命令行交互询问用户问题
 * 2、根据用户回答的结果生成文件
 */
const path = require('path')
const inquirer = require('inquirer')
const fs = require('fs')
const ejs = require('ejs')

inquirer.prompt([{
    type: 'input',
    name: 'name',
    message: 'Project name?'
}]).then(anwsers => {
    //  console.log(anwsers)  // { name: 'myName' }
    // 根据用户回答的结果生成文件

    //模板目录
    const temDir = path.join(__dirname, 'templates')
    //目标目录
    const destDir = process.cwd()
    fs.readdir(temDir, (err, files) => {
        if (err) throw err
        files.forEach(file => {
            // console.log(file)
            //通过模板引擎渲染文件
            ejs.renderFile(path.join(temDir, file), anwsers, (err, result) => {
                if (err) throw err
                fs.writeFileSync(path.join(destDir, file), result)
            })
        });
    })
})
```
* templates/index.html
```js
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>name</title>
</head>
<body>
</body>
</html>
```
* 关联到全局变量yarn link
* 执行测试
```js
mkdir test  // 创建测试文件夹
cd test    // 切换文件夹
cli-demo   // 执行脚手架
```
### Gulp完成项目的自动化构建
```js
// 实现这个项目的构建任务

const { src, dest, parallel, series, watch } = require('gulp')

const del = require('del')
const browserSync = require('browser-sync')

const loadPlugins = require('gulp-load-plugins')

const plugins = loadPlugins()
const BS = browserSync.create()

const data = {
  menus: [
    {
      name: 'Home',
      icon: 'aperture',
      link: 'index.html'
    },
    {
      name: 'Features',
      link: 'features.html'
    },
    {
      name: 'About',
      link: 'about.html'
    },
    {
      name: 'Contact',
      link: '#',
      children: [
        {
          name: 'Twitter',
          link: 'https://twitter.com/w_zce'
        },
        {
          name: 'About',
          link: 'https://weibo.com/zceme'
        },
        {
          name: 'divider'
        },
        {
          name: 'About',
          link: 'https://github.com/zce'
        }
      ]
    }
  ],
  pkg: require('./package.json'),
  date: new Date()
}

const clean = () => {
  return del(['dist', 'temp'])
}

const style = () => {
  // 通过src的选项参数base来确定转换过后的基准路径
  return src('src/assets/styles/*.scss', { base: 'src' })
    .pipe(plugins.sass({ outputStyle: 'expanded' })) // 完全展开构建后的代码
    .pipe(dest('temp'))
}

const script = () => {
  return src('src/assets/scripts/*.js', { base: 'src' })
     // 只是去唤醒babel/core这个模块当中的转换过程
     // babel作为一个平台不做任何事情，只是提供一个环境
     // presets 就是插件的集合
    .pipe(plugins.babel({ presets: ['@babel/preset-env'] }))
    .pipe(dest('temp'))
}

const page = () => {
  return src('src/*.html', { base: 'src' })
    .pipe(plugins.swig({ data: data, defaults: { cache: false } }))  // 编译html，并将数据对象中的变量注入模板，不缓存
    .pipe(dest('temp'))
}

const image = () => {
  return src('src/assets/images/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const font = () => {
  return src('src/assets/fonts/**', { base: 'src' })
    .pipe(plugins.imagemin())
    .pipe(dest('dist'))
}

const extra = () => {
  return src('public/**', { base: 'public' })
    .pipe(dest('dist'))
}

const serve = () => {
  watch('src/assets/styles/*.scss', style)
  watch('src/assets/scripts/*.js', script)
  watch('src/*.html', page)
  watch([
    'src/assets/images/**',
    'src/assets/fonts/**',
    'public/**'
  ], BS.reload)

  BS.init({
    notify: false, // 是否提示
    port: 3000, // 端口
    open: true, // 自动打开页面 默认true
    files: 'temp/**', // 启动后自动监听的文件
    server: { 
      baseDir: ['temp', 'src', 'public'],
      routes: { // 优先于baseDir
        '/node_modules': 'node_modules'
      }
    }
  })
}

const useref = () => {
  return src('temp/*.html', { base: 'temp' })
    .pipe(plugins.useref({ searchPath: ['dist', '.'] }))
    // html js css三种流
    // 压缩js文件
    .pipe(plugins.if(/\.js$/, plugins.uglify()))
    // 压缩css文件
    .pipe(plugins.if(/\.css$/, plugins.cleanCss()))
    // 压缩html文件
    .pipe(
      plugins.if(/\.html$/,plugins.htmlmin({ // 默认只压缩空白字符
          collapseWhitespace: true,
          minifyCSS: true,
          minifyJS: true
        })))
    .pipe(dest('dist'))
}

const compile = parallel(style, script, page)

// 上线之前执行的任务
const build = series(
  clean, 
  parallel(
    series(compile, useref), 
    image, 
    font, 
    extra
  )  
)

const develop = series(compile, serve)

module.exports = {
  clean,
  build,
  develop
}
```
