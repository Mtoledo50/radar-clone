import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module'; // ✅ 1. Importe o AuthModule

@Module({
  imports: [
    PrismaModule, 
    AuthModule // ✅ 2. Adicione-o aqui para compartilhar o JwtService e Guards
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}