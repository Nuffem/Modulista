import { ListType } from './types/ListType.js';
import { TextType } from './types/TextType.js';
import { NumberType } from './types/NumberType.js';
import { BooleanType } from './types/BooleanType.js';

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
