import Lista from './types/Lista.js';
import Texto from './types/Texto.js';
import Número from './types/Numero.js';
import Lógico from './types/Logico.js';
import Soma from './types/Soma.js';
import Subtracao from './types/Subtracao.js';
import Referencia from './types/Referencia.js';
import Condicional from './types/Condicional.js';
import Funcao from './types/Funcao.js';
import Comentario from './types/Comentario.js';

const types = {
    Lista,
    Texto,
    Número,
    Lógico,
    Soma,
    Subtracao,
    Referencia,
    Condicional,
    Funcao,
    Comentario,
};

export const itemTypes = Object.fromEntries(
    Object.values(types).map(type => [type.name, type])
);

export const availableTypes = Object.values(itemTypes);
