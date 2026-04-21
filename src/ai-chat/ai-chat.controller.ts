import { Controller, Post, Body, Res, HttpStatus, Logger, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { AiChatService } from './ai-chat.service';
import { ChatMessageDto } from './dto/chat-message.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UsersService } from '../users/users.service';

@ApiTags('AI Chat')
@Controller('ai/chat')
export class AiChatController {
  private readonly logger = new Logger(AiChatController.name);

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async chat(
    @Body() dto: ChatMessageDto,
    @CurrentUser('id') userId: string,
    @Res() res: Response,
  ) {
    try {
      // Fetch user context directly via the service (no HTTP round-trip)
      let userContext = null;
      try {
        userContext = await this.usersService.getAiContext(userId);
      } catch (e) {
        this.logger.warn(`Failed to resolve AI context for user ${userId}`);
      }

      // Set headers for streaming
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Transfer-Encoding', 'chunked');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.status(HttpStatus.OK);

      // Stream chunks directly to the client
      for await (const chunk of this.aiChatService.streamChat(
        dto.message,
        dto.history || [],
        userContext,
      )) {
        res.write(chunk);
      }

      res.end();
    } catch (error) {
      this.logger.error('AI Chat Error', error);
      if (!res.headersSent) {
        res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
          error: 'Failed to get AI response. Please try again.',
        });
      } else {
        res.end();
      }
    }
  }
}
