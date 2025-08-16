import { ListType } from './types/ListType.js';
import { TextType } from './types/TextType.js';
import { NumberType } from './types/NumberType.js';
import { BooleanType } from './types/BooleanType.js';

const types = {
    ListType,
    TextType,
    NumberType,
    BooleanType,
};

export const itemTypes = Object.fromEntries(
    Object.values(types).map(type => [type.name, type])
);

export const availableTypes = Object.values(itemTypes);
