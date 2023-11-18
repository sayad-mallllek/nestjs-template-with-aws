import { Injectable } from '@nestjs/common';
import { PathImpl2 } from '@nestjs/config';
import { I18nContext, I18nService, TranslateOptions } from 'nestjs-i18n';

import { I18nTranslations } from '@/types/i18n.types';

@Injectable()
export class TranslatorService {
  constructor(private readonly i18n: I18nService) {}

  translate(key: PathImpl2<I18nTranslations>, options?: TranslateOptions) {
    return this.i18n.t(key, {
      lang: I18nContext.current().lang,
      ...options,
    });
  }
}
