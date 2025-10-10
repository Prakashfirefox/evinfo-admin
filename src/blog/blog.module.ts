
// src/blog/blog.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BlogController } from './blog.controller.js';
import { BlogService } from './blog.service.js';
import { BlogSchema } from '../schemas/blog.schema.js';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: 'Blog', schema: BlogSchema }]),
  ],
  controllers: [BlogController],
  providers: [BlogService],
  exports: [MongooseModule, BlogService],
})
export class BlogModule {}
