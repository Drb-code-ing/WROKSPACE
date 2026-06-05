function Greeting(name) {
  console.log('实例化', this)
  this.name = name
  console.log('hello ' + this.name)
}
Greeting.prototype.say = function() {
  console.log(`我叫${this.name}, 很高兴认识你`)
}
Greeting.prototype.work = function() {
  console.log(`我叫${this.name}, 我正在工作`)
}

// console.log(new Greeting('drb'))
const drb = new Greeting('drb')
drb.say()
drb.work()
