import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // 给controller 层一个交代的
  getHello(): string {
    // 响应什么问题 交给service 层
    // this -> model
    return 'Hello World!';
  }
}
