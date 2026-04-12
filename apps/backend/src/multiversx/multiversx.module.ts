import { Module } from '@nestjs/common';
import { MultiversxService } from './multiversx.service';
import { McpClientService } from './mcp-client.service';
import { McpContractService } from './mcp-contract.service';

@Module({
  providers: [MultiversxService, McpClientService, McpContractService],
  exports:   [MultiversxService, McpClientService, McpContractService],
})
export class MultiversxModule {}
