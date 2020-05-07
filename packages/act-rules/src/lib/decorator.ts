'use strict';

import { ACTRuleResult } from '@qualweb/act-rules';
import rules from './rules.json';
import { DomUtils, AccessibilityUtils } from '@qualweb/util';
import languages from './language.json';

function ACTRule<T extends { new (...args: any[]): {} }>(constructor: T) {
  const rule = rules[constructor.name];
  
  rule.metadata.passed = 0;
  rule.metadata.warning = 0;
  rule.metadata.failed = 0;
  rule.metadata.outcome = '';
  rule.metadata.description = '';
  rule.results = new Array<ACTRuleResult>();
  
  const newConstructor: any = function () {
    let func: any = function () {
      return new constructor(rule);
    }
    func.prototype = constructor.prototype;
    return new func();
  }
  newConstructor.prototype = constructor.prototype;
  return newConstructor;
}

function ElementExists(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = function() {
    if (arguments[0]) {
      return method.apply(this, arguments);
    }
  };
}

function ElementHasAttributes(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value =  function() {
    const hasAttributes = arguments[0].elementHasAttributes();
    if (hasAttributes) {
      return method.apply(this, arguments);
    }
  };
}

function ElementHasAttribute(attribute: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const attr = arguments[0].elementHasAttribute( attribute);
      if (attr) {
        return method.apply(this, arguments);
      }
    };
  };
}

function ElementHasNonEmptyAttribute(attribute: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const attr = arguments[0].getElementAttribute( attribute);
      if (attr && attr.trim()) {
        return method.apply(this, arguments);
      }
    };
  };
}

function ElementHasAttributeRole(role: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const _role = arguments[0].getElementAttribute('role');//await AccessibilityUtils.getElementRole(arguments[0], arguments[1]);
      if (!_role || _role === role) {
        return method.apply(this, arguments);
      }
    };
  };
}

function ElementHasAttributeValue(attribute: string, value: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const attr = arguments[0].getElementAttribute(attribute);//await AccessibilityUtils.getElementRole(arguments[0], arguments[1]);
      if (attr && attr === value) {
        return method.apply(this, arguments);
      }
    };
  };
}

function IfElementHasTagNameMustHaveAttributeRole(tagName: string, role: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const _tagName = arguments[0].getElementTagName();
      if (_tagName === tagName) {
        const _role = arguments[0].getElementAttribute( 'role');//await AccessibilityUtils.getElementRole(arguments[0], arguments[1]);
        if (!_role || _role === role) {
          return method.apply(this, arguments);
        }
      } else {
        return method.apply(this, arguments);
      }
    };
  };
}

function ElementIsInAccessibilityTree(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = async function() {
    const isInAT = await AccessibilityUtils.isElementInAT(arguments[0], arguments[1]);
    if (isInAT) {
      return method.apply(this, arguments);
    }
  };
}

function ElementSrcAttributeFilenameEqualsAccessibleName(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = async function() {
    const src = arguments[0].getElementAttribute('src');

    if (src) {
      const filePath = src.split('/');
      const filenameWithExtension = filePath[filePath.length - 1];

      const accessibleName = await AccessibilityUtils.getAccessibleName(arguments[0], arguments[1]);

      if (filenameWithExtension === accessibleName) {
        return method.apply(this, arguments);
      }
    }
  };
}

function ElementIsVisible(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = async function() {
    const isVisible = await DomUtils.isElementVisible(arguments[0]);
    if (isVisible) {
      return method.apply(this, arguments);
    }
  };
}

function ElementHasOneOfTheFollowingRoles(roles: string[]) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const role = await AccessibilityUtils.getElementRole(arguments[0], arguments[1]);
      if (!!role && roles.includes(role)) {
        return method.apply(this, arguments);
      }
    };
  };
}

function IsDocument(document: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const rootElement = arguments[1].getPageRootElement();
      if(rootElement) {
        const tagName = rootElement.getElementTagName();
        if (tagName === document) {
          return method.apply(this, arguments);
        }
      }
    };
  };
}

function IsNotMathDocument(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
  const method = descriptor.value;
  descriptor.value = function() {
    const isMathDocument = true;//DomUtils.isMathDocument(arguments[1].url());
    if (!isMathDocument) {
      return method.apply(this, arguments);
    }
  };
}

function IsLangSubTagValid(attribute: string) {
  return function(target: any, propertyKey: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    descriptor.value = async function() {
      const attr = arguments[0].getElementAttribute( attribute);
      if (attr && isSubTagValid(attr.split('-')[0])) {
        return method.apply(this, arguments);
      }
    };
  };
}

function isSubTagValid(subTag: string): boolean {
  return languages.hasOwnProperty(subTag);
}

export { 
  ACTRule, 
  ElementExists, 
  ElementHasAttributes,
  ElementHasAttribute,
  ElementHasAttributeRole,
  ElementHasAttributeValue,
  IfElementHasTagNameMustHaveAttributeRole,
  ElementHasNonEmptyAttribute,
  ElementIsInAccessibilityTree,
  ElementSrcAttributeFilenameEqualsAccessibleName,
  ElementIsVisible,
  ElementHasOneOfTheFollowingRoles,
  IsDocument,
  IsNotMathDocument,
  IsLangSubTagValid
};