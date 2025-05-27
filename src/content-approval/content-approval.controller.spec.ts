import { Test, TestingModule } from '@nestjs/testing';
import { ContentApprovalController } from './content-approval.controller';

describe('ContentApprovalController', () => {
  let controller: ContentApprovalController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContentApprovalController],
    }).compile();

    controller = module.get<ContentApprovalController>(ContentApprovalController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
