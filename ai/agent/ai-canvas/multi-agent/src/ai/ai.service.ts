import { Injectable } from '@nestjs/common';
import { OssService } from './oss.service';
import { ImageStoreService } from './image-store.service';
import { ImageDto } from './dto/image.dto';

@Injectable()
export class AiService {
  constructor(
    private readonly ossService: OssService,
    private readonly imageStoreService: ImageStoreService,
  ) {}
  getUploadSignature(ext?: string) {
    return this.ossService.createUploadPolicy(ext);
  }

  createImage(dto: ImageDto) {
    // 多模态大模型 生成图片...
    return this.imageStoreService.add(dto);
  }
}
