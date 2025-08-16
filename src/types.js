import Lista from './types/Lista.js';
import Texto from './types/Texto.js';
import Número from './types/Numero.js';
import Lógico from './types/Logico.js';

const types = {
    Lista,
    Texto,
    Número,
    Lógico,
};

export const itemTypes = Object.fromEntries(
    Object.values(types).map(type => [type.name, type])
);

export const availableTypes = Object.values(itemTypes);
