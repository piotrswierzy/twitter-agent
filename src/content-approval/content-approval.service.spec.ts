import { Test, TestingModule } from '@nestjs/testing';
import { ContentApprovalService } from './content-approval.service';

describe('ContentApprovalService', () => {
  let service: ContentApprovalService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ContentApprovalService],
    }).compile();

    service = module.get<ContentApprovalService>(ContentApprovalService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
