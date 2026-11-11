import { ArrayMinSize, IsArray, IsString } from 'class-validator';

export class CommandsDto {
  /** Shell commands, executed sequentially. */
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  readonly commands: string[];
}
