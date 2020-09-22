'use strict';

import { QWElement } from '@qualweb/qw-element';
import { QWPage } from "@qualweb/qw-page";
import { DomUtils } from '@qualweb/util';

function isElementHiddenByCSS(elementQW: QWElement, pageQW: QWPage): boolean {
  const parent = elementQW.getElementParent();
  let parentHidden = false;
  let result;
  if (parent) {
    parentHidden = DomUtils.isElementHiddenByCSS(parent, pageQW);
  }
  result = DomUtils.isElementHiddenByCSSAux(elementQW) || parentHidden;

  return result;
}

export default isElementHiddenByCSS;
