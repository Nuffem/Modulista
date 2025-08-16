import { ListType } from './types/ListType.js';
import { TextType } from './types/TextType.js';
import { NumberType } from './types/NumberType.js';
import { BooleanType } from './types/BooleanType.js';

export const itemTypes = {
    LIST: ListType,
    TEXT: TextType,
    NUMBER: NumberType,
    BOOLEAN: BooleanType,
};

// Add a 'type' property to each type object
for (const key in itemTypes) {
    itemTypes[key].type = key;
}

export const availableTypes = Object.values(itemTypes);
