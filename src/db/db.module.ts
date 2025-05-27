import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Tweet } from './entities/tweet.entity';
import { Reply } from './entities/reply.entity';
import { DbService } from './db.service';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        url: configService.get('DATABASE_URL'),
        entities: [Tweet, Reply],
        synchronize: process.env.NODE_ENV !== 'production', // Don't use in production!
        logging: process.env.NODE_ENV !== 'production',
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([Tweet, Reply]),
  ],
  providers: [DbService],
  exports: [DbService],
})
export class DbModule {}
