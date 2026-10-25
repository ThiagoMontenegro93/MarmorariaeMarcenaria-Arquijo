import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { AuditService } from '../../common/audit/audit.service';
import type { UsuarioAutenticado } from '../../common/decorators/usuario-atual.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import type { CriarUsuarioDto, LoginDto } from './auth.dto';

/** Custo do bcrypt: 12 rodadas (~250ms) equilibra segurança e tempo de login. */
export const BCRYPT_ROUNDS = 12;

/** Hash fictício válido, usado quando o e-mail não existe (tempo de resposta constante). */
const HASH_FICTICIO = bcrypt.hashSync('usuario-inexistente', BCRYPT_ROUNDS);

const SELECAO_PUBLICA = { id: true, nome: true, email: true, perfil: true, telefone: true, ativo: true, ultimoLoginEm: true, criadoEm: true } as const;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly audit: AuditService,
  ) {}

  async login(dto: LoginDto, meta: { ip: string | null; userAgent: string | null }) {
    const usuario = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    // Compara mesmo quando o usuário não existe, para não vazar por tempo de resposta.
    const hash = usuario?.senhaHash ?? HASH_FICTICIO;
    const senhaOk = await bcrypt.compare(dto.senha, hash);

    if (!usuario || !senhaOk || !usuario.ativo || usuario.deletadoEm) {
      await this.audit.registrar({ acao: 'LOGIN_FALHA', entidade: 'Usuario', entidadeId: usuario?.id, dados: { email: dto.email }, ...meta });
      throw new UnauthorizedException('E-mail ou senha inválidos.');
    }

    await this.prisma.usuario.update({ where: { id: usuario.id }, data: { ultimoLoginEm: new Date() } });
    await this.audit.registrar({ usuarioId: usuario.id, acao: 'LOGIN_SUCESSO', entidade: 'Usuario', entidadeId: usuario.id, ...meta });

    const payload: UsuarioAutenticado = { sub: usuario.id, email: usuario.email, nome: usuario.nome, perfil: usuario.perfil };
    return {
      accessToken: await this.jwt.signAsync(payload),
      usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, perfil: usuario.perfil },
    };
  }

  perfil(id: string) {
    return this.prisma.usuario.findUniqueOrThrow({ where: { id }, select: SELECAO_PUBLICA });
  }

  listarUsuarios() {
    return this.prisma.usuario.findMany({ where: { deletadoEm: null }, select: SELECAO_PUBLICA, orderBy: { nome: 'asc' } });
  }

  async criarUsuario(dto: CriarUsuarioDto, autorId: string) {
    const existe = await this.prisma.usuario.findUnique({ where: { email: dto.email } });
    if (existe) throw new ConflictException('Já existe um usuário com este e-mail.');
    const usuario = await this.prisma.usuario.create({
      data: { nome: dto.nome, email: dto.email, perfil: dto.perfil, telefone: dto.telefone, senhaHash: await bcrypt.hash(dto.senha, BCRYPT_ROUNDS) },
      select: SELECAO_PUBLICA,
    });
    await this.audit.registrar({ usuarioId: autorId, acao: 'USUARIO_CRIAR', entidade: 'Usuario', entidadeId: usuario.id, dados: { perfil: dto.perfil } });
    return usuario;
  }
}
