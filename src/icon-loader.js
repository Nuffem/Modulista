const iconCache = new Map();

export async function loadIcon(name, {
    size,
    color
} = {}) {
    if (iconCache.has(name)) {
        return iconCache.get(name);
    }

    try {
        const response = await fetch(`src/icons/${name}.svg`);
        if (!response.ok) {
            throw new Error(`Could not load icon: ${name}`);
        }
        let svgText = await response.text();

        // Adiciona classes de tamanho e cor, se fornecidas
        if (size || color) {
            const parser = new DOMParser();
            const doc = parser.parseFromString(svgText, "image/svg+xml");
            const svgElement = doc.documentElement;
            if (size) {
                size.split(' ').forEach(c => svgElement.classList.add(c));
            }
            if (color) {
                color.split(' ').forEach(c => svgElement.classList.add(c));
            }
            svgText = new XMLSerializer().serializeToString(svgElement);
        }

        iconCache.set(name, svgText);
        return svgText;
    } catch (error) {
        console.error(error);
        return ''; // Retorna uma string vazia em caso de erro
    }
}
