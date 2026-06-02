import { IsIn } from 'class-validator';

const allowedActions = ['START_NEGOTIATION', 'ISSUE_ORDER'] as const;

export type ProgressRequestAction = (typeof allowedActions)[number];

export class ProgressRequestDto {
  @IsIn(allowedActions)
  action!: ProgressRequestAction;
}
