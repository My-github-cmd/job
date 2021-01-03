### webpck的构建流程主要有那些环节？尽可能的描述webpack打包的整个流程
* 根据配置找出打包入口文件
* 把入口文件代码解析成抽象语法树，然后分析，提取形成模块依赖树
* 根据模块依赖树深度递归找到每个节点对应的资源文件
* 然后再根据loader属性找到资源文件的加载器，然后将对应文件交给相应加载器处理
* 最后将加载器处理的结果放入bundle.js中输出实现整个项目打包

### Loader和plugin有那些不同？请描述一下开发loader和plugin的思路
* 不同点
  * Loader的定位时模块加载器，用于处理不同的模块资源文件，将模块资源文件从输入到输出的转换，比如css模块,js模块等
  * Loader是一个函数，接收资源参数，然后返回一段JavaScript代码，或者返回一个module.exports导出的结果，交给另一个Loader进行处理，Loader的执行顺序是从后往前执行
  * Plugin的定位是扩展webpack功能，增加webpack的自动化能力，比如清空目录，资源复制，资源转换和压缩等等
  * Plugin通过钩子机制实现，在webpack生命周期钩子中挂载任务来实现扩展，Plugin是一个函数或者是一个包含apply方法的对象
  
* Loader实现思路
  * 定义一个函数，函数的参数是文件资源参数
  * 在函数里面对资源参数进行处理
  * 返回一段JavaScript对吗或者返回一个modules.exports（export default）导出的数据
* Plugin实现思路
  * 定义一个插件类
  * 里面实现apply方法，apply方法参数有compile对象
  * 在comoile对象钩子中挂载任务方法，任务方法中接收一个compilation对象参数
  * 在compilation对象中获取此次打包的资源信息，对打包资源信息进行处理

### 使用webpack打包vue项目
* 为了实现webpack的打包命令，需要安装webpck webpack-cli到开发依赖中，编写要给公共文件webpack.common.js，作为公用的打包命令
```js
const path = require('path');
module.exports = {
entry:'./src/main.js',  // 入口文件
output:{
  path:path.resolve(__ditname,'dist')  // 打包出口文件，__dirname代表着绝对路径
  }
}
 ```
 * 运行webpack.common.js会发现报错，查看报错发现都是因为没有相应的loader导致的，所以接下来需要引入相应的loader，因为是vue项目首先安装vue-loader对vue文件进行解析和转换
```js
module:{
  rules:[
    {
      test:/\.vue$/,
      use:['vue-loader]  // vue-loader解析vue文件
    }
  ]
}
```
* vue项目中用到的是less,需要安装less-loader对less进行解析和编译，同时，还需要安装caa-loader和style-loader对css文件和vue中的style标签进行解析
```js
{
  test:/\.less$/,
  use:['style-loader','css-loader','less-loader']
},
{
  test:/\.css$/,
  use:['style-loader','css-loader']
}
```
* 对js文件的解析，需要用到babel-loader和@vue/cli-plugin-babel，需要在weboack中配置loader的加载规则，并且还需再根目录中添加babel.config.js
```js
{
  test:/\.js$/,
  // 不包含node_modules中的js文件
  exclude:/node_modules/,
  loader:'babel-loader'
}
// babel.config.js
module.exports = {
  .presets:[
    '@vue/cli-plugin-babel/preset'
  ]
}
```
* 对图片文件进行处理，使用的时url-loader，由于url-loader是基于file-loader，所以我们需要同时安装这两个loader
```js
{
  test:/\.(png|jpe?g|gif|svg)(\?.*)?$/,
  loader:'url-loader',
  options:{
    limit: 10 *1024, // 10kb
    esModule: false
  }
}
```
* 这里还需要使用VueLoaderPlugin插件，在vue-loader中可以找到，否则打包的时候会报错
```js
const VueLoaderPlugin = require('vue-loader/lib/plugin')
plugins:[new VUeLoaderPlugin()]
```
* 安装html-webpack-plugin插件来解析html文件
```js
plugins:[
  new HtmlWebpackPlugin({
    template:'./public/index.html'
  })
]
```
* 整个打包环境基本上配置好了，现在需要启动项目，需要安装webpack-dev-server,通过yarn webpack-dev-server --config webpcak.dev.js --open运行项目并自动打开浏览器
* 生产化环境下，我们还需要关闭source Map来防止源代码泄漏，同时需要用hash值来命名我们的文件名，已防止浏览器的缓存
* 接下来，我们还需要将css文件分离出来，需要安装mini-extract-plugin
```js
module: {
    rules: [
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      }
    ]
  },
  
   plugins: [
    new MiniCssExtractPlugin({
      filename: "css/[name].[hash:7].css",
      chunkname: path.posix.join("static", "css/[id].[chunkhash:7].css")
    })
  ]
```
* 对css文件和js文件进行压缩和分包，并且通过webpack来去掉代码中的debugger和console，需要安装optimize-css-assets-webpack-plugin 和 terser-webpack-plugin
```js
optimization: {
    //代码分包
    splitChunks: {
      chunks: "all"
    },
    minimize: true,
    minimizer: [
      //css压缩
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          discardComments: { remove: true } //移除注释
        }
      }),
      new TerserPlugin({
        parallel: true, //开启多线程来提高构建速度
        sourceMap: false,
        terserOptions: {
          warnings: false, //不展示warning
          compress: {
            unused: true, //去除未使用的
            drop_debugger: true, //移除debugger
            drop_console: true //去除console
          },
          output: {
            comments: false //去除注释
          }
        }
      })
    ]
  }
```
* 打包命令太长，可以配置script命令
```js
 "scripts": {
        "serve": "webpack-dev-server --config webpack.dev.js --open",
        "build": "webpack --config webpack.prod.js",
        "lint": "eslint ./src"
    }
```
* webpack.common.js文件的所有配置
```js
const path = require("path");

const VueLoaderPlugin = require("vue-loader/lib/plugin");

const HtmlWebpackPlugin = require("html-webpack-plugin");

//公共的打包配置
module.exports = {
  //入口文件
  entry: "./src/main.js",
  //打包出口文件 这个里面我们需要用到__dirname来生成一个绝对路径
  output: {
    path: path.resolve(__dirname, "dist")
  },
  module: {
    rules: [
      {
        test: /\.(vue|js)$/,
        loader: "eslint-loader",
        exclude: /node_modules/,
        // 预处理
        enforce: "pre"
      },
      {
        test: /\.vue$/,
        //用于解析vue文件
        use: ["vue-loader"]
      },
      {
        test: /\.js$/,
        //刨除node_modules中的js代码
        exclude: /node_modules/,
        //对于js代码，我们需要使用babel-loader来进行代码的转换编译
        use: ["babel-loader"]
      },
      {
        test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
        //对于文件的复制
        loader: "url-loader",
        //限制最大为10k 超过10K还是按文件存储，不会转换为base64
        options: {
          limit: 10 * 1024,
          //一定要加这个 不然src中会是一个object module
          esModule: false
        }
      }
    ]
  },
  plugins: [
    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: "./public/index.html"
    })
  ]
};
```
* webpack.dev.js文件的所有配置
```js
const commonConfig = require("./webpack.common");
const { DefinePlugin } = require("webpack");

const { merge } = require("webpack-merge");

module.exports = merge(commonConfig, {
  //开发环境
  mode: "development",
  //指定sourceMap
  devtool: "#@cheap-module-source-map",
  module: {
    rules: [
      {
        test: /\.less$/,
        //对于less代码，我们需要使用less-loader来转换，然后再用css-loader 和 vue-style-loader
        use: ["style-loader", "css-loader", "less-loader"]
      },
      {
        test: /\.css$/,
        //这个是用来转换vue中的style标签和css文件的
        use: ["style-loader", "css-loader"]
      }
    ]
  },
  plugins: [
    new DefinePlugin({
      //定义BASE_URL index.html中需要使用
      BASE_URL: "/public/"
    })
  ]
});
```
* webpack.prod.js文件的所有配置
```js
const { merge } = require("webpack-merge");
const commonConfig = require("./webpack.common");
const { DefinePlugin, LoaderOptionsPlugin } = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");

const { CleanWebpackPlugin } = require("clean-webpack-plugin");

const MiniCssExtractPlugin = require("mini-css-extract-plugin");

const OptimizeCSSAssetsPlugin = require("optimize-css-assets-webpack-plugin");

const TerserPlugin = require("terser-webpack-plugin");

const path = require("path");

//生产环境的配置
module.exports = merge(commonConfig, {
  mode: "production",
  //去除sourceMap
  devtool: "none",

  //输出的文件名
  output: {
    filename: "js/[name].[hash:8].js",
    publicPath: "./"
  },
  //更改css和less的loader
  module: {
    rules: [
      {
        test: /\.less$/,
        use: [MiniCssExtractPlugin.loader, "css-loader", "less-loader"]
      },
      {
        test: /\.css$/,
        use: [MiniCssExtractPlugin.loader, "css-loader"]
      }
    ]
  },

  plugins: [
    new HtmlWebpackPlugin({
      template: "./public/index.html",
      favicon: "./public/favicon.ico", // 在此处设置
      //对html代码进行压缩
      minify: {
        removeComments: true, //去注释
        collapseWhitespace: true, //压缩空格
        removeAttributeQuotes: true //去除属性引用
      }
    }),
    new DefinePlugin({
      BASE_URL: process.env.NODE_ENV
    }),
    //用于每次生成的时候，清理上次的打包文件
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: "css/[name].[hash:7].css",
      chunkname: path.posix.join("static", "css/[id].[chunkhash:7].css")
    })
  ],
  optimization: {
    //代码分包
    splitChunks: {
      chunks: "all"
    },
    minimize: true,
    minimizer: [
      //css压缩
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          discardComments: { remove: true } //移除注释
        }
      }),
      new TerserPlugin({
        parallel: true, //开启多线程来提高构建速度
        sourceMap: false,
        terserOptions: {
          warnings: false, //不展示warning
          compress: {
            unused: true, //去除未使用的
            drop_debugger: true, //移除debugger
            drop_console: true //去除console
          },
          output: {
            comments: false //去除注释
          }
        }
      })
    ]
  }
});
```