# Promise
 - make a promise
     new Promise
     Promise{<pending>} 待处理
     fullfilled | rejected 不能再变

 - rejected 可能性
     只要有一个失败，整体失败，不在等待其他Promise 执行
     走catch，第一个失败的原因