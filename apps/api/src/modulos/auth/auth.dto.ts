import { ApiProperty } from '@nestjs/swagger';
import { PerfilUsuario } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@arquijo.com.br' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'TroqueEstaSenha!2026' })
  @IsString()
  @MinLength(8)
  @MaxLength(128)
  senha: string;
}

export class CriarUsuarioDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  nome: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
  @IsEmail()
  email: string;

  /** Mínimo 10 caracteres com letras e números. */
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/^(?=.*[A-Za-z])(?=.*\d).+$/, { message: 'A senha deve conter letras e números.' })
  senha: string;

  @IsEnum(PerfilUsuario)
  perfil: PerfilUsuario;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  telefone?: string;
}
