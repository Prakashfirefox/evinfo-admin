import { Controller, Get, Param, Query } from '@nestjs/common';
import { BlogService } from './blog.service.js';

@Controller('blogs')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @Get()
  async findAll(@Query('published') published?: string) {
    return this.blogService.findAll(published);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.blogService.findOne(id);
  }
}

