import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GoogleMeResponseDto {
  @ApiProperty({ type: String, example: '1234567890' })
  sub: string;

  @ApiPropertyOptional({ type: String, example: 'user@example.com' })
  email?: string;

  @ApiPropertyOptional({ type: String, example: 'John Doe' })
  name?: string;
}

export class GithubMeResponseDto {
  @ApiProperty({ type: String, enum: ['github'] })
  provider: 'github';

  @ApiProperty({ type: String, example: '123456' })
  providerId: string;

  @ApiProperty({ type: String, example: 'octocat' })
  login: string;

  @ApiProperty({ type: String, nullable: true, example: 'John Doe' })
  name: string | null;
}

export type MeResponseDto = GoogleMeResponseDto | GithubMeResponseDto;
