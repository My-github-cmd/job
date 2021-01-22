### vue首次渲染的过程
* 在首次渲染前，首先进行vue初始化，初始化实例成员和静态成员
* 当初始化结束后，要调用vue的构造函数<color style="color:#58bc58">new Vue({})</color>,在构造函数中定义了<color style="color:#58bc58">_init()</color>方法，这个方法相当于整个vue文件的入口
* 在<color style="color:#58bc58">_init()</color>方法中，调用了$mount,一共有两个$mount,第一个定义在入口文件<color style="color:#58bc58">entry-runtime-with-compiler.js</color>文件中，该$mount的核心作用是将模板编译成render函数，但是首先会判断是否传入render选项，如果没有传入，它回去获取<color style="color:#58bc58">template</color>选项，如果template选项也没有，则会将el中的内容编译成模板，然后把模板编译成render函数，它是通过<color style="color:#58bc58">compileToFunctions()</color>函数，将模板编译为render函数，当把render函数编译后，render函数将会存在<color style="color:#58bc58">options.render</color>中
* 接着会调用<color style="color:#58bc58">src/platforms/web/runtime/index.js</color>文件中$mount方法，该方法首先会重新获取el，因为如果是运行时的版本，是不会走<color style="color:#58bc58">entry-runtime-with-compiler.js</color>这个入口文件来获取el,所以运行时的版本，在<color style="color:#58bc58">runtime/index.js</color>文件中， $mount中重新获取el
* 接下来调用<color style="color:#58bc58">mountComponent()</color>,这个方法在<color style="color:#58bc58">src/core/instance/lifecycle.js</color>中定义的，在<color style="color:#58bc58">mountComponent()</color>中，首先会判断render选项，如果没有render选项，但是我们传入了模板，并且当前是开发环境的话会发送一个警告，目的是如果我们当前使用运行时版本的Vue,而且我们没有传入render,但是传入了模版,告诉我们运行时版本不支持编译器。接下来会触发beforeMount这个生命周期中的钩子函数，也就是开始挂载之前
* 然后定义了<color style="color:#58bc58">updateComponent(</color>)，在这个函数中，调用<color style="color:#58bc58">vm._render</color>和<color style="color:#58bc58">vm._update</color>，<color style="color:#58bc58">vm._render</color>的作用是生成虚拟DOM，<color style="color:#58bc58">vm._update</color>的作用是将虚拟DOM转换成真实DOM，并且挂载到页面上
* 创建<color style="color:#58bc58">Watcher</color>对象，在创建Watcher时，传递了<color style="color:#58bc58">updateComponent</color>这个函数，这个函数最终是在Watcher内部调用的。在Watcher内部会用了get方法，当<color style="color:#58bc58">Watcher</color>创建完成之后,会触发生命周期中的<color style="color:#58bc58">mounted</color>钩子函数,在get方法中，会调用<color style="color:#58bc58">updateComponent()</color>
* 挂载结束，最终返回Vue实例。

### vue响应式原理
* vue响应式是从Vue实例init()方法中开始的
* 在init()方法中先调用initState()初始化vue实例的状态，在initState方法中调用initData(),initData()是把data属性注入到vue实例中，并且调用observe(data)将data转换为响应式的对象
* observe是响应式的入口
  * 在observe(value)中，首先判断传入的参数value是否是对象，不是对象直接返回
  * 再判断对象是否有__ob__这个属性，如果有，则说明该数据已经是响应式的数据了，直接返回
  * 如果没有，创建observer对象，返回observer对象
* 在创建observer对象时，给当前的vue对象定义不可枚举的__ob__属性，记录当前的observer对象，然后再进行数组的响应式处理和对象的响应式处理
  * 数组的响应式处理，就是设置数组的几个特殊的方法，push,pop,sort等这些方法会改变原数组，所以这些方法被调用的时候需要发送通知
    * 找到数组对象中的__ob__对象中的dep,调用dep的notify()方法
    * 再遍历数组中每一个成员，对每个成员调用observe()，如果这个成员是对象的话，也会转换成响应式对象
  * 对象的响应式处理，就是调用walk方法，walk方法就是遍历对象的每一个属性，对每个属性调用defineReactive方法
  * defineReactive会为每一个属性创建对应的dep对象，让dep去收集依赖，如果当前属性的值是对象，会调用observe，defineReactive中最核心的方法是getter 和 setter
    * getter 的作用是收集依赖，收集依赖时，为每一个属性收集依赖，如果这个属性的值是对象，那也要为子对象收集依赖，最后返回属性的值
    * 在setter 中，先保存新值，如果新值是对象，也要调用 observe ，把新设置的对象也转换成响应式的对象，然后派发更新（发送通知），调用dep.notify()
  * 收集依赖时
    * 在watcher对象的get方法中调用pushTarget, 记录Dep.target属性
    * 访问data中的成员的时候收集依赖，defineReactive的getter中收集依赖
    * 把属性对应的 watcher 对象添加到dep的subs数组中，也就是为属性收集依赖
    * 如果属性的值也是对象，给childOb收集依赖，目的是子对象添加和删除成员时发送通知
  * 在数据发生变化的时候
    * 调用dep.notify()发送通知，dep.notify()会调用watcher对象的update()方法
    * update()中的调用queueWatcher()，会去判断watcher是否被处理，如果这个watcher对象没有被处理的话，添加到queue队列中，并调用flushScheduleQueue()
        * 在flushScheduleQueue()中触发beforeUpdate钩子函数
        * 调用watcher.run() : run()-->get() --> getter() --> updateComponent()
        * 然后清空上一次的依赖
        * 触发actived的钩子函数
        * 触发updated钩子函数

### 虚拟dom中key的作用和好处
* 作用：主要用在 Vue 的虚拟 DOM 算法，在新旧 nodes 对比时辨识 VNodes，相当于唯一标识ID
  * 在交叉对比的时候，当新节点跟旧节点头尾交叉对比没有结果的时候，会根据新节点的 key 去对比旧节点数组中的 key，从而找到相应旧节点（这里对应的是一个 key => index 的 map 映射）。如果没找到就认为是一个新增节点。而如果没有 key，那么就会采用一种遍历查找的方式去找到对应的旧节点。一种是一个 map 映射，另一种是遍历查找。相比而言。map 映射的速度更快
* 好处：Vue 会尽可能高效地渲染元素，通常会复用已有元素而不是从头开始渲染

### vue模板编译过程
* 模版编译入口函数compileToFunctions
    * 内部首先从缓存加载编译好的render函数
    * 如果缓存中没有，调用compile开始编译
* 在 compile 函数中
    * 首先合并选项options
    * 调用 baseCompile 编译模版 
* compile的核心是合并选项options， 真正处理是在basCompile中完成的，把模版和合并好的选项传递给baseCompile, 这里面完成了模版编译的核心三件事情
    * parse()
        * 把模版字符串转化为AST 对象，也就是抽象语法树
    * optimize()
        * 对抽象语法树进行优化，标记静态语法树中的所以静态根节点
        * 检测到静态子树，设置为静态，不需要在每次重新渲染的时候重新生成节点
        * patch的过程中会跳过静态根节点
* generator()
    * 把优化过的AST对象，转化为字符串形式的代码
* 执行完成之后，会回到入口函数complieToFunctions
    * compileToFunction会继续把字符串代码转化为函数
    * 调用createFunction
    * 当 render 和 staticRenderFns初始化完毕，最终会挂在到Vue实例的options对应的属性中