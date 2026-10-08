import { PartialType } from '@nestjs/mapped-types';
import { CreateTaxObligationDto } from './create-tax-obligation.dto';

export class UpdateTaxObligationDto extends PartialType(CreateTaxObligationDto) {}