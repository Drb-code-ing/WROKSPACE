import { Controller, Query, Get, Post, Body } from '@nestjs/common';
import { AiService } from './ai.service';
import { ImageDto } from './dto/image.dto';

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Get('/oss/upload-signature')
  // Query 装饰器用于获取查询参数ext  ?:string 表示ext 是可选的字符串类型
  getUploadSignature(@Query('ext') ext?: string) {
    console.log(ext);
    return this.aiService.getUploadSignature(ext);
  }

  @Post('image')
  // dto nestjs 对请求体进行解析
  createImage(@Body() dto: ImageDto) {
    // console.log(dto);
    return this.aiService.createImage(dto);
  }
}
