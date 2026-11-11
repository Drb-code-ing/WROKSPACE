// 格式转换
import { Transform } from 'class-transformer';
// 类型效验
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ImageDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  prompt: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) =>
    typeof value === 'string' && value.trim() ? value.trim() : undefined,
  )
  imageUrl?: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  // 是否自动扩展提示词
  promptExtand?: boolean;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value ?? true)
  watermark?: boolean;
}
