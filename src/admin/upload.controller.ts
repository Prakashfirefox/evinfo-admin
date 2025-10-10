import { Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

function filename(req: any, file: any, cb: (err: Error | null, filename: string) => void) {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const name = `${uniqueSuffix}${extname(file.originalname)}`;
  cb(null, name);
}

@Controller('admin')
export class AdminUploadController {
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({ destination: './uploads', filename }),
      limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    }),
  )
  upload(@UploadedFile() file: any) {
    return {
      url: `/uploads/${file.filename}`,
      name: file.originalname,
      size: file.size,
      mimeType: file.mimetype,
    };
  }
}
