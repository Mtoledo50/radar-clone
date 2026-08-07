import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * Update aceita todos os campos opcionais (atualização parcial)
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}