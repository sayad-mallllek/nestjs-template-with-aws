import { Global, Module } from '@nestjs/common';
import {
  AcceptLanguageResolver,
  CookieResolver,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import * as path from 'path';

import { TranslatorService } from './translator.service';

@Global()
@Module({
  imports: [
    I18nModule.forRoot({
      fallbackLanguage: 'en',
      loaderOptions: {
        path: path.join(require.main.path, '/i18n/'),
        watch: true,
      },
      resolvers: [
        { use: QueryResolver, options: ['lang', 'l'] },
        AcceptLanguageResolver,
        CookieResolver,
      ],
      typesOutputPath: path.join('../../types/i18n.types.ts'),
    }),
  ],
  providers: [TranslatorService],
})
export class TranslatorModule {}
