import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { BlogDocument } from '../schemas/blog.schema.js';

@Injectable()
export class BlogService {
  constructor(
    @InjectModel('Blog') private readonly blogModel: Model<BlogDocument>,
  ) {}

  async findAll(published?: string) {
    const filter: any = {};
    if (published !== undefined) {
      filter.published = published === 'true' || published === '1';
    }
    return this.blogModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  async findOne(id: string) {
    const doc = await this.blogModel.findById(id).exec();
    if (!doc) throw new NotFoundException('Blog not found');
    return doc;
  }

  // small helpers you can use later
  async create(payload: Partial<BlogDocument>) {
    console.log(payload);
    const created = new this.blogModel(payload);
    return created.save();
  }

  async update(id: string, payload: Partial<BlogDocument>) {
    const updated = await this.blogModel
      .findByIdAndUpdate(id, payload, { new: true })
      .exec();
    if (!updated) throw new NotFoundException('Blog not found');
    return updated;
  }

  async remove(id: string) {
    const res = await this.blogModel.findByIdAndDelete(id).exec();
    if (!res) throw new NotFoundException('Blog not found');
    return { deleted: true };
  }
}
