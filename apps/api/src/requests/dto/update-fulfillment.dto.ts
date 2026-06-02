import { IsIn } from 'class-validator';

const allowedActions = [
  'CONFIRM_ORDER',
  'START_PRODUCTION',
  'MARK_DISPATCHED',
  'MARK_DELIVERED',
] as const;

export type FulfillmentAction = (typeof allowedActions)[number];

export class UpdateFulfillmentDto {
  @IsIn(allowedActions)
  action!: FulfillmentAction;
}
