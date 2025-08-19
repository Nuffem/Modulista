const iconCache = new Map();

const iconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

// Mapeamento de nomes de ícones personalizados para Material Icons
const iconMapping = {
    'home': 'home',
    'plus': 'add',
    'three-dots-vertical': 'more_vert',
    'pencil': 'edit',
    'trash': 'delete',
    'list': 'list',
    'code': 'code',
    'upload': 'upload',
    'download': 'download',
    'check': 'check',
    'x': 'close',
    'text': 'text_fields',
    'number': 'numbers',
    'boolean': 'toggle_on',
    'list-square': 'view_list',
    'soma': 'add',
    'subtracao': 'remove',
    'grab-handle': 'drag_indicator',
    'folder': 'folder'
};

export async function loadIcon(name, {
    size = iconSize,
    color = iconColor
} = {}) {
    const cacheKey = `${name}-${size}-${color}`;
    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey);
    }

    try {
        // Obter o nome do Material Icon
        const materialIconName = iconMapping[name] || name;
        
        // Criar HTML do Material Icon
        const classes = ['material-icons'];
        if (size) {
            classes.push(...size.split(' '));
        }
        if (color) {
            classes.push(...color.split(' '));
        }
        
        const iconHtml = `<span class="${classes.join(' ')}">${materialIconName}</span>`;
        
        iconCache.set(cacheKey, iconHtml);
        return iconHtml;
    } catch (error) {
        console.error(error);
        return ''; // Retorna uma string vazia em caso de erro
    }
}
