import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Injectable()
export class DatabaseLoggerService implements OnModuleInit {
  private readonly logger = new Logger(DatabaseLoggerService.name);

  constructor(@InjectConnection() private readonly connection: Connection) {}

  onModuleInit() {
    // Log when connection opens successfully
    this.connection.once('open', () => {
      this.logger.log('✅ MongoDB connection is open and ready!');
    });

    // Log any connection errors
    this.connection.on('error', (err) => {
      this.logger.error(`❌ MongoDB connection error: ${err.message}`, err.stack);
    });

    // Log when connection is disconnected
    this.connection.on('disconnected', () => {
      this.logger.warn('⚠️ MongoDB connection has been disconnected.');
    });

    // Optional: Log when reconnecting
    this.connection.on('reconnected', () => {
      this.logger.log('🔁 MongoDB reconnected successfully.');
    });
  }
}
