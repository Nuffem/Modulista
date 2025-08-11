import { ListType } from './ListType.js';
import { TextType } from './TextType.js';
import { NumberType } from './NumberType.js';
import { BooleanType } from './BooleanType.js';

export const TYPE_LIST = 'list';
export const TYPE_TEXT = 'text';
export const TYPE_NUMBER = 'number';
export const TYPE_BOOLEAN = 'boolean';

export const itemTypes = {
    [TYPE_LIST]: ListType,
    [TYPE_TEXT]: TextType,
    [TYPE_NUMBER]: NumberType,
    [TYPE_BOOLEAN]: BooleanType,
};

export const availableTypes = Object.values(itemTypes);
