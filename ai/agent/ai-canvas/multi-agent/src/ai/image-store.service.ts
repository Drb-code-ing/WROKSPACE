import { Injectable } from '@nestjs/common';
import { ImageDto } from './dto/image.dto';

@Injectable()
export class ImageStoreService {
  add(dto: ImageDto) {}
}
