### 当我们点击按钮的时候动态给 data 增加的成员是否是响应式数据，如果不是的话，如何把新增成员设置成响应式数据，它的内部原理是什么
* 不是响应式的，vue只能拦截预先定义的对象属性，对于新增的name属性是不能拦截到的；也就是说当vue实例创建好之后，data中的成员是在创建vue对象的时候，通过new Observer来将其设置为响应式数据，当vue实例化完成后，再添加一个成员，此时仅仅是在vm上增加了一个js属性，并不是响应式的
* 设置为响应式有两种方法
  * 一：给dog的name属性设置要给初始值，可以是空的字符串或者是undefined等
    
    * 原因：创建vue实例的时，调用_proxyData方法，通过Object.defineProperty()将data中的数据设置为getter和setter，dog是一个对象，对象中添加了name成员，当数据发生变化的时候会触发Observe，通过walk方法，判断传入的数据是否是一个对象，如果是一个对象，调用defineReactive方法遍历该对象并给该对象的成员添加getter和setter，所以新添加的成员也是响应式的
  * 二：通过Vue.set(object, propertyName, value) object:需要添加属性的对象 propertyName:需要添加的属性名 value:添加的属性值
    ```js
    export function set (target: Array<any> | Object, key: any, val: any): any {
      if (process.env.NODE_ENV !== 'production' &&
        (isUndef(target) || isPrimitive(target))
      ) {
        warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
      }
      if (Array.isArray(target) && isValidArrayIndex(key)) {
        target.length = Math.max(target.length, key)
        target.splice(key, 1, val)
        return val
      }
      if (key in target && !(key in Object.prototype)) {
        target[key] = val
        return val
      }
      const ob = (target: any).__ob__
      if (target._isVue || (ob && ob.vmCount)) {
        process.env.NODE_ENV !== 'production' && warn(
          'Avoid adding reactive properties to a Vue instance or its root $data ' +
          'at runtime - declare it upfront in the data option.'
        )
        return val
      }
      if (!ob) {
        target[key] = val
        return val
      }
      defineReactive(ob.value, key, val)
      ob.dep.notify()
      return val
    }
    ```
    * 如果是在开发环境，且 target 未定义（为 null、undefined ）或 target 为基础数据类型（string、boolean、number、symbol）时，抛出告警
    * 如果 target 为数组且 key 为有效的数组 key 时，将数组的长度设置为 target.length 和 key 中的最大的那一个，然后调用数组的 splice 方法（ vue 中重写的 splice 方法）添加元素
    * 如果属性 key 存在于 target 对象中且 key 不是 Object.prototype 上的属性时，表明这是在修改 target 对象属性 key 的值（不管 target 对象是否是响应式的，只要 key 存在于 target 对象中，就执行这一步逻辑），此时就直接将 value 直接赋值给 target[key]
    * 判断 target，当 target 为 vue 实例或根数据 data 对象时，在开发环境下抛错
    * 当一个数据为响应式时，vue 会给该数据添加一个 ob 属性，因此可以通过判断target对象是否存在 ob 属性来判断 target 是否是响应式数据，当 target 是非响应式数据时，我们就按照普通对象添加属性的方式来处理；当 target 对象是响应式数据时，我们将 target 的属性 key 也设置为响应式并手动触发通知其属性值的更新

### diff算法的执行过程
* Diff算法的执行过程就是调用patch的函数，比较新旧节点，将差异部分更新到真实dom。patch函数接收两个参数oldValue和Vnode,分别代表新节点和旧节点。patch函数会比较oldValue和vnode是否相同，如果不同将差异部分渲染到真实dom中，即通过调用sameValue(oldValue,vnode)函数，相同则执行patchVnode,否则用Vnode替换掉oldValue

* patchVnode函数所作的工作
  * 找到真实的dom，称为el
  * 判断vnode和oldValue是否指向同一对象
    * 如果是，直接返回true
    * 如果他们都有文本节点并且不相等，那么将el的文本节点设置为vnode的文本节点
    * 如果oldValue有子节点而vnode没有子节点，则删除el的子节点
    * 如果oldValue没有子节点而vnode有子节点，那么vnode的子节点真实化后添加到el
    * 如果两者都有子节点，则会执行updataChildren函数比较子节点

```js
updateChildren (parentElm, oldCh, newCh) {
    let oldStartIdx = 0, newStartIdx = 0
    let oldEndIdx = oldCh.length - 1
    let oldStartVnode = oldCh[0]
    let oldEndVnode = oldCh[oldEndIdx]
    let newEndIdx = newCh.length - 1
    let newStartVnode = newCh[0]
    let newEndVnode = newCh[newEndIdx]
    let oldKeyToIdx
    let idxInOld
    let elmToMove
    let before
    while (oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx) {
        if (oldStartVnode == null) {   // 对于vnode.key的比较，会把oldVnode = null
            oldStartVnode = oldCh[++oldStartIdx] 
        }else if (oldEndVnode == null) {
            oldEndVnode = oldCh[--oldEndIdx]
        }else if (newStartVnode == null) {
            newStartVnode = newCh[++newStartIdx]
        }else if (newEndVnode == null) {
            newEndVnode = newCh[--newEndIdx]
        }else if (sameVnode(oldStartVnode, newStartVnode)) {
            patchVnode(oldStartVnode, newStartVnode)
            oldStartVnode = oldCh[++oldStartIdx]
            newStartVnode = newCh[++newStartIdx]
        }else if (sameVnode(oldEndVnode, newEndVnode)) {
            patchVnode(oldEndVnode, newEndVnode)
            oldEndVnode = oldCh[--oldEndIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if (sameVnode(oldStartVnode, newEndVnode)) {
            patchVnode(oldStartVnode, newEndVnode)
            api.insertBefore(parentElm, oldStartVnode.el, api.nextSibling(oldEndVnode.el))
            oldStartVnode = oldCh[++oldStartIdx]
            newEndVnode = newCh[--newEndIdx]
        }else if (sameVnode(oldEndVnode, newStartVnode)) {
            patchVnode(oldEndVnode, newStartVnode)
            api.insertBefore(parentElm, oldEndVnode.el, oldStartVnode.el)
            oldEndVnode = oldCh[--oldEndIdx]
            newStartVnode = newCh[++newStartIdx]
        }else {
          // 使用key时的比较
            if (oldKeyToIdx === undefined) {
                oldKeyToIdx = createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx) // 有key生成index表
            }
            idxInOld = oldKeyToIdx[newStartVnode.key]
            if (!idxInOld) {
                api.insertBefore(parentElm, createEle(newStartVnode).el, oldStartVnode.el)
                newStartVnode = newCh[++newStartIdx]
            }
            else {
                elmToMove = oldCh[idxInOld]
                if (elmToMove.sel !== newStartVnode.sel) {
                    api.insertBefore(parentElm, createEle(newStartVnode).el, oldStartVnode.el)
                }else {
                    patchVnode(elmToMove, newStartVnode)
                    oldCh[idxInOld] = null
                    api.insertBefore(parentElm, elmToMove.el, oldStartVnode.el)
                }
                newStartVnode = newCh[++newStartIdx]
            }
        }
    }
    if (oldStartIdx > oldEndIdx) {
        before = newCh[newEndIdx + 1] == null ? null : newCh[newEndIdx + 1].el
        addVnodes(parentElm, before, newCh, newStartIdx, newEndIdx)
    }else if (newStartIdx > newEndIdx) {
        removeVnodes(parentElm, oldCh, oldStartIdx, oldEndIdx)
    }
}
```
* （oldStartIdx = 0）：oldVnode 的 startIdx, 初始值为 0
* （newStartIdx = 0）：vnode 的 startIdx, 初始值为 0
* （oldEndIdx = oldCh.length - 1）：oldVnode 的 endIdx, 初始值为 oldCh.length - 1
* （oldStartVnode = oldCh[0]）：oldVnode 的初始开始节点
* （oldEndVnode = oldCh[oldEndIdx]）：oldVnode 的初始结束节点
* （newEndIdx = newCh.length - 1）：vnode 的 endIdx, 初始值为 newCh.length - 1
* （newStartVnode = newCh[0]）：vnode 的初始开始节点
* （newEndVnode = newCh[newEndIdx]）：vnode 的初始结束节点
* 当 oldStartIdx <= oldEndIdx && newStartIdx <= newEndIdx 时，执行如下循环判断：

  * oldStartVnode 为 null，则 oldStartVnode 等于 oldCh 的下一个子节点，即 oldStartVnode 的下一个兄弟节点
  * oldEndVnode 为 null, 则 oldEndVnode 等于 oldCh 的相对于 oldEndVnode 上一个子节点，即 oldEndVnode 的上一个兄弟节点
  * newStartVnode 为 null，则 newStartVnode 等于 newCh 的下一个子节点，即 newStartVnode 的下一个兄弟节点
  * newEndVnode 为 null, 则 newEndVnode 等于 newCh 的相对于 newEndVnode 上一个子节点，即 newEndVnode 的上一个兄弟节点
  * oldEndVnode 和 newEndVnode 为相同节点则执行 patchVnode(oldStartVnode, newStartVnode)，执行完后 oldStartVnode 为此节点的下一个兄弟节点，newStartVnode 为此节点的下一个兄弟节点
  * oldEndVnode 和 newEndVnode 为相同节点则执行 patchVnode(oldEndVnode, newEndVnode)，执行完后 oldEndVnode 为此节点的上一个兄弟节点，newEndVnode 为此节点的上一个兄弟节点
  * oldStartVnode 和 newEndVnode 为相同节点则执行 patchVnode(oldStartVnode, newEndVnode)，执行完后 oldStartVnode 为此节点的下一个兄弟节点，newEndVnode 为此节点的上一个兄弟节点
  * oldEndVnode 和 newStartVnode 为相同节点则执行 patchVnode(oldEndVnode, newStartVnode)，执行完后 oldEndVnode 为此节点的上一个兄弟节点，newStartVnode 为此节点的下一个兄弟节点
  * 使用 key 时的比较：
    * oldKeyToIdx为未定义时，由 key 生成 index 表，具体实现为  createKeyToOldIdx(oldCh, oldStartIdx, oldEndIdx)
```js
function createKeyToOldIdx(children: Array<VNode>, beginIdx: number, endIdx: number): KeyToIndexMap {
  let i: number, map: KeyToIndexMap = {}, key: Key | undefined, ch;
  for (i = beginIdx; i <= endIdx; ++i) {
    ch = children[i];
    if (ch != null) {
      key = ch.key;
      if (key !== undefined) map[key] = i;
    }
  }
  return map;
}
```
* 在createKeyToOldIdx 方法中，用 oldCh 中的 key 属性作为键，而对应的节点的索引作为值。然后再判断在 newStartVnode 的属性中是否有 key，且是否在 oldKeyToIndx 中找到对应的节点。

  * 如果不存在这个 key，那么就将这个 newStartVnode 作为新的节点创建且插入到原有的 root 的子节点中，然后将 newStartVnode 替换为此节点的下一个兄弟节点。
  * 如果存在这个key，那么就取出 oldCh 中的存在这个 key 的 vnode，然后再进行 diff 的过程，并将 newStartVnode 替换为此节点的下一个兄弟节点

* 上面判断执行完后，oldStartIdx 大于 oldEndIdx，则将 vnode 中多余的节点根据 newStartIdx 插入到 dom 中去；newStartIdx 大于 newEndIdx，则将 dom 中在区间 [oldStartIdx， oldEndIdx]的元素节点删除，diff算法执行过程结束

### 模拟 VueRouter 的 hash 模式的实现，实现思路和 History 模式类似，把 URL 中的 # 后面的内容作为路由的地址，可以通过 hashchange 事件监听路由地址的变化
```js
let _Vue = null
export default class VueRouter {
    static install(Vue) {
        // 1、判断当前插件是否已经安装
        if (VueRouter.install.installed) {
            return
        }
        VueRouter.install.installed = true
            // 2、把 vue 构造函数记录到全局变量
        _Vue = Vue
            // 3、把创建 vue 实例时候传入的 router 对象注入到 vue 实例上
            // 混入
        _Vue.mixin({
            beforeCreate() {
                if (this.$options.router) {
                    _Vue.prototype.$router = this.$options.router
                    this.$options.router.init()
                }
            }
        })
    }
    constructor(options) {
        this.options = options
        this.routeMap = {}
        this.data = _Vue.observable({
            current: '/'
        })
    }
    init() {
        this.createRouteMap()
        this.initComponents(_Vue)
        this.initEvent()
    }
    createRouteMap() {
        // 遍历所有的路由规则，把路由规则解析成键值对的形式，存储到 routeMap 中
        this.options.routes.forEach(route => {
            this.routeMap[route.path] = route.component
        })
    }
    initComponents(Vue) {
        const self = this
        Vue.component(
            'router-link', {
                props: {
                    to: String
                },
                render(h) {
                    return h('a', {
                        attrs: {
                            href: '#' + this.to
                        },
                        on: {
                            click: this.clickHandler
                        }
                    }, [this.$slots.default])
                },
                methods: {
                    clickHandler(e) {
                        window.location.hash = '#' + this.to
                        this.$router.data.current = this.to
                        e.preventDefault()
                    }
                }
                // template: '<a :href="to"><slot></slot></a>'
            }
        )

        Vue.component('router-view', {
            render(h) {
                const conmponent = self.routeMap[self.data.current]
                return h(conmponent)
            }
        })
    }

    initEvent() {
        window.addEventListener('load', this.hashChange.bind(this))
        window.addEventListener('hashchange', this.hashChange.bind(this))
    }
    hashChange() {
        if (!window.location.hash) {
            window.location.hash = '#/'
        }
        this.data.current = window.location.hash.substr(1)

    }
}
```

### 在vue.js响应式源码的基础上实现v-html
* compiler添加如下代码:
```js
htmlUpdata(node, value, key) { // v-html
      node.textContent = value
      new Watcher(this.vm, key, newValue => {
          node.textContent = newValue
      })
  }
```
### 参考 Snabbdom 提供的电影列表的示例，利用Snabbdom 实现类似的效果

![image-20210113115655372](D:\桌面文件\技术笔记\作业\job\新建文件夹\image-20210113115655372.png)

```js
// app.js
import { init, h } from 'snabbdom'
import attributes from 'snabbdom/modules/attributes'
import style from 'snabbdom/modules/style'
import classModule from 'snabbdom/modules/class'
// import class from 'snabbdom/modules/class'
import eventlisteners from 'snabbdom/modules/eventlisteners'
import { originalData } from './data'
// 使用init注册模块生成patch方法
const patch = init([attributes, style, classModule, eventlisteners])
// 数据模型
let data = [
    ...originalData
];

// 应用状态及配置
let vnode; // 老的虚拟节点
let nextKey = 11;  // 新增交互的索引
let margin = 8; // 列表项间距
let sortBy = 'rank'; // 初始排序类型
var totalHeight = 0;  // 初始list高度

// 交互
function changeSort(prop) {
    sortBy = prop;
    data.sort((a, b) => {
        if (a[prop] > b[prop]) {
            return 1;
        }
        if (a[prop] < b[prop]) {
            return -1;
        }
        return 0;
    });
    render();
}

function add() {
    var n = originalData[Math.floor(Math.random() * 10)];
    data = [{ rank: nextKey++, title: n.title, desc: n.desc, elmHeight: 0 }].concat(data);
    render();
    render();
}

function remove(movie) {
    data = data.filter((m) => { return m !== movie; });
    render();
}

// 应用入口组件
function view(data) {
    return (h('div#app', [
        h('h1', 'Top 10 movies'),
        h('div', [
            h('a.btn.add', { on: { click: add } }, 'Add'),
            'Sort by: ',
            h('span.btn-group', [
                h('a.btn.rank', { class: { active: sortBy === 'rank' }, on: { click: [changeSort, 'rank'] } }, 'Rank'),
                h('a.btn.title', { class: { active: sortBy === 'title' }, on: { click: [changeSort, 'title'] } }, 'Title'),
                h('a.btn.desc', { class: { active: sortBy === 'desc' }, on: { click: [changeSort, 'desc'] } }, 'Description'),
            ]),
        ]),
        h('div.list', { style: { height: totalHeight + 'px' } }, data.map(movieView))
    ]))
}
// 列表项组件
function movieView(movie) {
    return h('div.row', {
        key: movie.rank,
        style: {
            opacity: '0', transform: 'translate(-200px)',
            delayed: { transform: `translateY(${movie.offset}px)`, opacity: '1' },  // 渲染状态
            remove: { opacity: '0', transform: `translateY(${movie.offset}px) translateX(200px)` } // 移除状态
        },
        hook: { insert: (vnode) => { movie.elmHeight = vnode.elm.offsetHeight; } },
    }, [
        h('div', { style: { fontWeight: 'bold' } }, movie.rank),
        h('div', movie.title),
        h('div', movie.desc),
        h('div.btn.rm-btn', { on: { click: [remove, movie] } }, 'x'),
    ]);
}

// 应用渲染
function render() {
    data = data.reduce((acc, m) => {
        var last = acc[acc.length - 1];
        m.offset = last ? last.offset + last.elmHeight + margin : margin;
        return acc.concat(m);
    }, []);
    totalHeight = data[data.length - 1].offset + data[data.length - 1].elmHeight;
    vnode = patch(vnode, view(data));
}

window.addEventListener('DOMContentLoaded', () => {
    let container = document.getElementById('app');
    vnode = patch(container, view(data));
    console.log(vnode)
    render();
});
```
```js
// data.js
export const originalData = [
    { rank: 1, title: 'The Shawshank Redemption', desc: 'Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency.', elmHeight: 0 },
    { rank: 2, title: 'The Godfather', desc: 'The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son.', elmHeight: 0 },
    { rank: 3, title: 'The Godfather: Part II', desc: 'The early life and career of Vito Corleone in 1920s New York is portrayed while his son, Michael, expands and tightens his grip on his crime syndicate stretching from Lake Tahoe, Nevada to pre-revolution 1958 Cuba.', elmHeight: 0 },
    { rank: 4, title: 'The Dark Knight', desc: 'When the menace known as the Joker wreaks havoc and chaos on the people of Gotham, the caped crusader must come to terms with one of the greatest psychological tests of his ability to fight injustice.', elmHeight: 0 },
    { rank: 5, title: 'Pulp Fiction', desc: 'The lives of two mob hit men, a boxer, a gangster\'s wife, and a pair of diner bandits intertwine in four tales of violence and redemption.', elmHeight: 0 },
    { rank: 6, title: 'Schindler\'s List', desc: 'In Poland during World War II, Oskar Schindler gradually becomes concerned for his Jewish workforce after witnessing their persecution by the Nazis.', elmHeight: 0 },
    { rank: 7, title: '12 Angry Men', desc: 'A dissenting juror in a murder trial slowly manages to convince the others that the case is not as obviously clear as it seemed in court.', elmHeight: 0 },
    { rank: 8, title: 'The Good, the Bad and the Ugly', desc: 'A bounty hunting scam joins two men in an uneasy alliance against a third in a race to find a fortune in gold buried in a remote cemetery.', elmHeight: 0 },
    { rank: 9, title: 'The Lord of the Rings: The Return of the King', desc: 'Gandalf and Aragorn lead the World of Men against Sauron\'s army to draw his gaze from Frodo and Sam as they approach Mount Doom with the One Ring.', elmHeight: 0 },
    { rank: 10, title: 'Fight Club', desc: 'An insomniac office worker looking for a way to change his life crosses paths with a devil-may-care soap maker and they form an underground fight club that evolves into something much, much more...', elmHeight: 0 },
];
```
```js
// index.html
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>snabbdom-list-demo</title>
    <style>
        body {
            background: #fafafa;
            font-family: sans-serif;
        }

        h1 {
            font-weight: normal;
        }

        .btn {
            display: inline-block;
            cursor: pointer;
            background: #fff;
            box-shadow: 0 0 1px rgba(0, 0, 0, .2);
            padding: .5em .8em;
            transition: box-shadow .05s ease-in-out;
            -webkit-transition: box-shadow .05s ease-in-out;
        }

        .btn:hover {
            box-shadow: 0 0 2px rgba(0, 0, 0, .2);
        }

        .btn:active,
        .active,
        .active:hover {
            box-shadow: 0 0 1px rgba(0, 0, 0, .2),
                inset 0 0 4px rgba(0, 0, 0, .1);
        }

        .add {
            float: right;
        }

        #container {
            max-width: 42em;
            margin: 0 auto 2em auto;
        }

        .list {
            position: relative;
        }

        .row {
            overflow: hidden;
            position: absolute;
            box-sizing: border-box;
            width: 100%;
            left: 0px;
            margin: .5em 0;
            padding: 1em;
            background: #fff;
            box-shadow: 0 0 1px rgba(0, 0, 0, .2);
            transition: transform .5s ease-in-out, opacity .5s ease-out, left .5s ease-in-out;
            -webkit-transition: transform .5s ease-in-out, opacity .5s ease-out, left .5s ease-in-out;
        }

        .row div {
            display: inline-block;
            vertical-align: middle;
        }

        .row>div:nth-child(1) {
            width: 5%;
        }

        .row>div:nth-child(2) {
            width: 30%;
        }

        .row>div:nth-child(3) {
            width: 65%;
        }

        .rm-btn {
            cursor: pointer;
            position: absolute;
            top: 0;
            right: 0;
            color: #C25151;
            width: 1.4em;
            height: 1.4em;
            text-align: center;
            line-height: 1.4em;
            padding: 0;
        }
    </style>
</head>

<body>
    <div id="app"></div>
</body>
<script src="./src/app.js"></script>

</html>
```