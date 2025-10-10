import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule, getModelToken } from '@nestjs/mongoose';
import { AdminModule } from '@adminjs/nestjs';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AdminUploadController } from './admin/upload.controller.js';
import provider from './admin/auth-provider.js';
import buildAdminOptions from './admin/options.js';
import { DatabaseLoggerService } from './database-logger.service.js';
import { Blog, BlogSchema } from './schemas/blog.schema.js';
import { BlogService } from './blog/blog.service.js';
import { BlogController } from './blog/blog.controller.js';
import { BlogModule } from './blog/blog.module.js';

@Module({
  imports: [
    // Load environment variables globally
    ConfigModule.forRoot({ envFilePath: '.env', isGlobal: true }),

    // ✅ MongoDB connection
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri:
          configService.get<string>('DATABASE_URL') ||
          configService.get<string>('MONGO_URI') ||
          'mongodb://localhost:27017/evinfo-dev',
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
        bufferCommands: false,
        family: 4,
      }),
    }),

    // ✅ Import BlogModule to make BlogModel available
    BlogModule,

    // ✅ AdminJS setup - now BlogModel will be available
    AdminModule.createAdminAsync({
      imports: [BlogModule], // Import BlogModule here as well
      // Inject the model provider by token name directly to avoid timing/interop issues
      inject: [getModelToken('Blog')],
      useFactory: async (BlogModel: any) => ({
        adminJsOptions: buildAdminOptions({ BlogModel }),
        auth: {
          provider,
          cookiePassword:
            process.env.COOKIE_SECRET || 'default-secret-change-in-production',
          cookieName: 'adminjs',
        },
        sessionOptions: {
          resave: true,
          saveUninitialized: true,
          secret:
            process.env.COOKIE_SECRET || 'default-secret-change-in-production',
        },
      }),
    }),
  ],

  controllers: [AppController, AdminUploadController],
  providers: [AppService, DatabaseLoggerService],
})
export class AppModule {}