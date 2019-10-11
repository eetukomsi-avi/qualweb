'use strict';

import {DomElement} from "htmlparser2";
import getLabel = require("./getLabel");

function getValueFromLabelWithControl(id: string, element: DomElement, processedHTML: DomElement[]): string {
  let label = getLabel(id, element, processedHTML);
  if (!label)
    label = element;

  let value = "";
  if (!label.children)
    return "";

  for (let child of label.children) {
    if (child.type === 'text')
      value += child.data;
    else
      value += getValueFromEmbededControl(child, processedHTML);
  }

  return value;
}

export = getValueFromLabelWithControl;
