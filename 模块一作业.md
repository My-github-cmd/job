# 谈谈对js异步编程的理解，event loop，消息队列都是做什么的，什么是宏任务，什么是微任务?

* js异步编程：指后一个任务不等待前一个任务执行完就执行，每一个任务有一个或者多个回调函数
  
* eventloop：事件循环，当js引擎遇到一个异步事件后并不会一直等待其返回结果，而是将这个事件挂起，继续执行执行执行栈中的其它任务。当一个异步事件返回结果后，js会将这个事件加入到与当前执行栈不同的另一个队列，也就是事件队列。被放入的事件队列不会立即执行其回调，而是等待当前执行栈中的所有的任务都执行完毕，主线程处于闲置状态的时候，主线程会去查找事件事件队列是否有任务，如果有，那么主线程会从中取出排在第一位的事件中，并把这个事件对用的回调放入执行栈中，然会执行其中的同步代码……，如此重复操作，就形成了一个无线循环，这个过程就是事件循环（eventloop)
  
* 宏任务和微任务：
  js异步操作，会有一个优先级的执行顺序，分为宏任务和微任务，宏任务（microtask）是宿主发起，包含（定时器，I/O,UI,rendering），微任务是JavaScript自身发起，包含（promise，process.nextTick等），在js执行的时候，执行栈先执行最先进入队列的宏任务，执行其同步代码直至结束，检查是否有微任务，有则会执行微任务队列为空，如果宿主为浏览器，可能会渲染浏览器，开始下一轮的tick，执行宏任务的异步代码


# 异步代码使用promise改进
```
    function promise(content, time) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve(content)
        }, time)
    })
}

promise('I', 10)
    .then(res => {
        return promise(res + "Love", 10)
    })
    .then((res) => {
        setTimeout(() => {
            console.log(res + "You")
        }, 10)
    })

```


# 二:基于一下完成下面的四个练习

* 练习一：函数组合fp.flowRight()实现下面函数
```
const isLastInStock = fp.flowRight(fp.prop('in_stock'),fp.last);
isLastInStock(cars);
```


* 练习二
```
const res = fp.flowRight(fp.prop('name),fp.first);
res(cars);
```

* 练习三
```
const averageDollarValue = fp.flowRight(_average,fp.map(fp.prop('dollar_value')))
averageDollarValue(cars)
```

* 练习四
```
const sanitizeNames = fp.flowRight(fp.toLower,fp.map(fp.replace(/\W+/g,"_")));
sanitizeNames('Hello World')
```


# 三

* 练习一
```
return maybe
    .map(x => fp.map((row) => fp.add(row, 1))(x))
```

* 练习二
```
return maybe
        .map(x => fp.first(x))
```

* 练习三
```
const res = safeProp('user',user);
res.map(x=>x)
```

* 练习四
```
Maybe
    .map(x => parseInt(x))
```


# 手写promise
```
const PADDING = 'padding';
const FUNFILLED = 'fulfilled';
const REJECTED = 'rejected'



class Mypromise {
    constructor(exector) {
        try {
            exector(this.resolve, this.reject); // 执行器,即回调函数   
        } catch (error) {
            this.reject(error)
        }
    }
    // 初始状态
    statu = PADDING;
    value = undefined;
    reason = undefined;
    // successCallBack = undefined;
    // fialCallBack = undefined
    successCallBack = []
    fialCallBack = []
    resolve = (value) => {
        if (this.statu !== PADDING) return // promise的状态改变后不再会变化，所以要防止promise的状态发生改变
        this.statu = 'FUNFILLED'
        this.value = value;
        // this.successCallBack && this.successCallBack(this.value)  // 异步调用单个then
        while (this.successCallBack.length) this.successCallBack.shift()()
    }
    reject = (reason) => {
        // 如果状态不是等待，阻止向下执行
        if (this.statu !== PADDING) return
        this.statu = 'REJECTED'
        this.reason = reason
        // this.fialCallBack && this.fialCallBack(this.reason)   // 异步调用单个then
        while (this.fialCallBack.length) this.fialCallBack.shift()()
    }
    then(successCallBack, fialCallBack) {
        successCallBack = successCallBack ? successCallBack : value => value;
        fialCallBack = fialCallBack ? fialCallBack : reason => { throw reason }
        let promise2 = new Promise((resolve, reject) => {
            if (this.statu === 'FUNFILLED') {
                // 为了拿到promise2，这里做异步处理
                setTimeout(() => {
                    try {
                        let x = successCallBack(this.value);
                        // 判断x的值是普通值还是promise对象
                        // 如果是普通值调用resolve
                        // 如果是promise对象 查看promise对象返回的结果
                        // 再根据返回的结果来判断是调用resolve还是reject
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        this.reject(error)
                    }
                }, 0)
            } else if (this.statu === 'REJECTED') {
                setTimeout(() => {
                    try {
                        let x = fialCallBack(this.reason);
                        // 判断x的值是普通值还是promise对象
                        // 如果是普通值调用resolve
                        // 如果是promise对象 查看promise对象返回的结果
                        // 再根据返回的结果来判断是调用resolve还是reject
                        resolvePromise(promise2, x, resolve, reject)
                    } catch (error) {
                        this.reject(error)
                    }
                }, 0)
            } else {
                // 异步调用单个then
                // this.successCallBack = successCallBack
                // this.fialCallBack = fialCallBack

                // 链式调用then方法的异步处理
                this.successCallBack.push(() => {
                    setTimeout(() => {
                        try {
                            let x = successCallBack(this.value);
                            // 判断x的值是普通值还是promise对象
                            // 如果是普通值调用resolve
                            // 如果是promise对象 查看promise对象返回的结果
                            // 再根据返回的结果来判断是调用resolve还是reject
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (error) {
                            this.reject(error)
                        }
                    }, 0)
                });
                this.fialCallBack.push(() => {
                    setTimeout(() => {
                        try {
                            let x = fialCallBack(this.reason);
                            // 判断x的值是普通值还是promise对象
                            // 如果是普通值调用resolve
                            // 如果是promise对象 查看promise对象返回的结果
                            // 再根据返回的结果来判断是调用resolve还是reject
                            resolvePromise(promise2, x, resolve, reject)
                        } catch (error) {
                            this.reject(error)
                        }
                    }, 0)
                });
            }
        });
        return promise2; // 为了then的链式调用
    }
    finally(callback) {
        return this.then((value) => {
            return Mypromise.resolve(callback()).then(() => value)
        }, (reason) => {
            return Mypromise.reject(callback()).then(() => { throw reason })
        })
    }
    catch(fialCallBack) {
        return this.then(undefined, fialCallBack)
    }
    // 实现promise.all()
    static all(array) {
        let result = [];
        let index = 0;
        return new Mypromise((resolve, reject) => {
            function addData(key, value) {
                result[key] = value;
                index++;
                if (index === array.length) {
                    resolve(result)
                }
            }
            for (var i = 0; i < array.lenght; i++) {
                let curray = array[i];
                if (curray instanceof Mypromise) {
                    // promise对象
                    curray.then(value => addData(i, value), reason => rejece(reason))
                } else {
                    addData(i, array[i])
                }
            }
        })
    }
    // 实现promise.resolve()
    static resolve(value) {
        if (value instanceof Mypromise) return value;
        return new Mypromise(resolve => resolve(value))
    }
}

// 实现return返回的结果作为下一个then的参数
function resolvePromise(promise, x, resolve, reject) {
    // 处理循环调用的问题（即return 相同的promise）
    if (promise === x) {
        return reject(new TypeError("你错了"))
    }
    if (x instanceof Mypromise) {
        // x.then(res => {
        //     console.log(res)
        // }, err => console.log(err))
        x.then(resolve, reject);
    } else {
        resolve(x);
    }
}
```