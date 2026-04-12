import { Module, forwardRef } from '@nestjs/common';
import { ReputationController } from './reputation.controller';
import { ReputationService } from './reputation.service';
import { MultiversxModule } from '../multiversx/multiversx.module';
import { TasksModule } from '../tasks/tasks.module';

@Module({
  imports: [
    MultiversxModule,
    forwardRef(() => TasksModule),
  ],
  controllers: [ReputationController],
  providers: [ReputationService],
  exports: [ReputationService],
})
export class ReputationModule {}
