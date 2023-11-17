import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { ApiExcludeEndpoint, ApiHideProperty } from '@nestjs/swagger';

@Controller()
export class AppController {
  constructor() {}

  @ApiExcludeEndpoint()
  @Get()
  getHello(@Res() res: Response) {
    res.sendFile('intro.html', {
      root: 'public',
    });
  }
}
