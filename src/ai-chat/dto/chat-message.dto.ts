import { IsString, IsNotEmpty, IsArray, IsOptional, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

class HistoryMessageDto {
  @IsString()
  @IsIn(['user', 'assistant'])
  role: 'user' | 'assistant';

  @IsString()
  content: string;
}

export class ChatMessageDto {
  @IsString()
  @IsNotEmpty({ message: 'Message is required' })
  message: string;

  @IsArray()
  @IsOptional()
  @Type(() => HistoryMessageDto)
  history?: HistoryMessageDto[];
}
