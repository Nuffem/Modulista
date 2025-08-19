const iconCache = new Map();

const defaultIconColor = "text-gray-500 dark:text-gray-400";
const iconSize = "w-6 h-6";

function getColorForType(type) {
    if (!type) return defaultIconColor;
    if (type.isExpression) return 'text-yellow-500';
    switch (type.valueType) {
        case 'text': return 'text-blue-500';
        case 'number': return 'text-green-500';
        case 'boolean': return 'text-purple-500';
        case 'list': return 'text-orange-500';
        default: return defaultIconColor;
    }
}

export async function loadIcon(name, {
    size = iconSize,
    color = null,
    type = null
} = {}) {
    const finalColor = color || getColorForType(type);
    const cacheKey = `${name}-${size}-${finalColor}`;

    if (iconCache.has(cacheKey)) {
        return iconCache.get(cacheKey);
    }

    try {
        const response = await fetch(`src/icons/${name}.svg`);
        if (!response.ok) {
            throw new Error(`Could not load icon: ${name}`);
        }
        let svgText = await response.text();

        // Adiciona classes de tamanho e cor, se fornecidas
        if (size || finalColor) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const svgElement = doc.documentElement;
            if (size) {
                size.split(' ').forEach(c => svgElement.classList.add(c));
            }
            if (finalColor) {
                finalColor.split(' ').forEach(c => svgElement.classList.add(c));
            }
            svgText = new XMLSerializer().serializeToString(svgElement);
        }

        iconCache.set(cacheKey, svgText);
        return svgText;
    } catch (error) {
        console.error(error);
        return ''; // Retorna uma string vazia em caso de erro
    }
}
