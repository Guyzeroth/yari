import acceptLanguageParser from "accept-language-parser";
import { Request } from "express";
import {
  DEFAULT_LOCALE,
  VALID_LOCALES,
  PREFERRED_LOCALE_COOKIE_NAME,
} from "../../libs/constants";
const VALID_LOCALES_LIST = [...VALID_LOCALES.values()];

function getLocale(request: Request, fallback = DEFAULT_LOCALE) {
  // First try by cookie.
  const cookieLocale: string = request.cookies[PREFERRED_LOCALE_COOKIE_NAME];
  if (cookieLocale) {
    // If it's valid, stick to it.
    if (VALID_LOCALES.has(cookieLocale.toLowerCase())) {
      return VALID_LOCALES.get(cookieLocale.toLowerCase());
    }
  }

  // Each header in request.headers is always a list of objects.
  const acceptLangHeaders = request.headers["accept-language"];
  const value = acceptLangHeaders || {};
  const locale =
    value &&
    acceptLanguageParser.pick(VALID_LOCALES_LIST, value, { loose: true });
  return locale || fallback;
}

export default getLocale;
