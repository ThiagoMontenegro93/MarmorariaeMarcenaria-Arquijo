import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { ErroCalculo } from '@arquijo/calc';
import type { Response } from 'express';

/** Converte erros de domínio do motor de cálculo em HTTP 422 com mensagem clara. */
@Catch(ErroCalculo)
export class ErroCalculoFilter implements ExceptionFilter {
  catch(erro: ErroCalculo, host: ArgumentsHost): void {
    host
      .switchToHttp()
      .getResponse<Response>()
      .status(HttpStatus.UNPROCESSABLE_ENTITY)
      .json({ statusCode: 422, erro: erro.name, message: erro.message });
  }
}
