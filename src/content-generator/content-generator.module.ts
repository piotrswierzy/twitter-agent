import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ContentGeneratorService } from './content-generator.service';

@Module({
  imports: [ConfigModule],
  providers: [ContentGeneratorService],
  exports: [ContentGeneratorService],
})
export class ContentGeneratorModule {}
