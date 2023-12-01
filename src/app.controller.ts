import { Controller, Get, Res } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';
import { Response } from 'express';

@Controller()
export class AppController {
  @ApiExcludeEndpoint()
  @Get()
  getHello(@Res() res: Response) {
    res.sendFile('intro.html', {
      root: 'public',
    });
  }
}
