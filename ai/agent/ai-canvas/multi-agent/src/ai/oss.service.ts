import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
// node 内置的crypto 加密模块，哈希  UUID  加解密
import { randomUUID } from 'node:crypto';
// OSS 客户端
import Oss from 'ali-oss';

export interface OssUploadSignature {
  // oss 主机名 https://ai-canvas.oss-cn-beijing.aliyuncs.com
  host: string;
  // oss 上传路径 如 ai-canvas/upload/123.jpg
  key: string;
  url: string;
  // OSS 访问密匙
  OSSAccessKeyId: string;
  // OSS 上传策略
  // 用于指定上传文件的权限、过期时间、文件大小等限制
  policy: string;
  // OSS 签名 用于验证上传文件的来源是否为您
  Signature: string;
  // 过期时间
  expire: string;
}

@Injectable()
export class OssService {
  // 允许上传的图片后缀，其余一律拒绝（ext 是用户可控参数，不能直接拼进 key）
  private static readonly ALLOWED_EXT = new Set([
    '.jpg',
    '.jpeg',
    '.png',
    '.webp',
    '.gif',
  ]);
  private bucket: string;
  private region: string;
  // OSS 客户端
  private readonly postClient: Oss;
  // 从环境变量中获取配置项的方法
  private trimEnv(key: string): string {
    return this.config.getOrThrow<string>(key).trim();
  }

  constructor(private readonly config: ConfigService) {
    this.bucket = this.trimEnv('OSS_BUCKET'); // 从环境变量中获取 bucket 名称
    this.region = this.trimEnv('OSS_REGION'); // 从环境变量中获取 region 名称
    // OSS 客户端配置
    this.postClient = new Oss({
      region: this.region,
      accessKeyId: this.trimEnv('OSS_ACCESS_KEY_ID'),
      accessKeySecret: this.trimEnv('OSS_ACCESS_KEY_SECRET'),
      bucket: this.bucket,
      secure: true, // 按https 返回签名
    });
  }
  createUploadPolicy(ext = '.jpg'): OssUploadSignature {
    const prefix = this.config.get<string>(
      'OSS_UPLOAD_PREFIX',
      'ai-canvas/uploads',
    );
    const normalizedExt = ext.startsWith('.') ? ext : `.${ext}`;
    if (!OssService.ALLOWED_EXT.has(normalizedExt.toLowerCase())) {
      throw new BadRequestException(`不支持的图片格式：${ext}`);
    }
    const key = `${prefix}/${Date.now()}-${randomUUID()}${normalizedExt}`;

    const host = `https://${this.bucket}.${this.region}.aliyuncs.com`;
    const expire = new Date();
    expire.setHours(expire.getHours() + 1); // 过期时间为 1 小时
    // 上传策略
    const policy = {
      expiration: expire.toISOString(), // 2026-01-01T00:00:00Z
      // 上传策略条件
      conditions: [
        ['content-length-range', 0, 1048576000],
        ['eq', '$key', key],
      ],
    };
    // OSS 签名：用 SK 对 Base64(policy) 做 HMAC-SHA1，SK 不出服务端
    // 注意方法名是 calculatePostSignature（表单直传专用），没有 calculateSignature
    const {
      OSSAccessKeyId,
      Signature,
      policy: policyBase64,
    } = this.postClient.calculatePostSignature(policy);

    return {
      key,
      host,
      // 私有桶不能直接用直链，这里给带时效的签名读取链接
      url: this.getReadUrl(key),
      Signature,
      OSSAccessKeyId,
      policy: policyBase64,
      expire: expire.toISOString(),
    };
  }

  /**
   * 生成带时效的读取链接（私有桶专用）
   * 入库只存 key，不要存这个 url —— 链接会过期
   */
  getReadUrl(key: string, expires = 3600): string {
    return this.postClient.signatureUrl(key, { expires });
  }
}
