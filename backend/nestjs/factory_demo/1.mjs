// 蜜雪冰城产品 冰淇淋
class IceCream {
  constructor() {
    this.name = '冰淇淋'
    this.price = 3
  }
  show() {
    console.log(`${this.name} 价格 ${this.price} 元`)
  }
}

class LemonTea {
  constructor() {
    this.name = '柠檬茶'
    this.price = 4
  }
  show() {
    console.log(`${this.name} 价格 ${this.price} 元`)
  }
}

class MilkTea {
  constructor() {
    this.name = '珍珠奶茶'
    this.price = 8
  }
  show() {
    console.log(`${this.name} 价格 ${this.price} 元`)
  }
}

// 工厂类
class MixueFactory {
 static create(type) {
  switch(type) {
    case 'ice':
      return new IceCream()
    case 'lemon':
      return new LemonTea()
    case 'milk':
      return new MilkTea()
  }
 }
}
// 管理并返回冰淇淋这个类
const drink1 = MixueFactory.create('ice')
drink1.show()
const drink2 = MixueFactory.create('lemon')
drink2.show()
