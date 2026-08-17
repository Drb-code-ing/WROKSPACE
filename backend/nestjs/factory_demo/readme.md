# 工厂模式
设计模式是面向对象编程 抽象的，23种
工厂模式是第一种最为重要的设计模式
NestFactory 是nestjs 提供的工厂类，用于创建nestjs 应用
NestFactory.create(AppModule)

以实现MixueFactory 帮我们提供工厂的各种类，和工厂里五花八门的类解耦
开发者只需要调用MixueFactory.create(type) 即可
由于工厂里的每个类都实现了相同的show 接口
有工厂类生产出来的类，可以放心的组件调用