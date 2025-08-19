# Icon Mapping: SVG to Material Icons

Este documento detalha o mapeamento dos ícones SVG personalizados para Material Icons do Google.

## Mapeamento de Ícones

| Nome Original | Material Icon | Descrição |
|---------------|---------------|-----------|
| `home` | `home` | Ícone de casa para navegação home |
| `plus` | `add` | Ícone de adicionar itens |
| `three-dots-vertical` | `more_vert` | Menu de contexto (três pontos verticais) |
| `pencil` | `edit` | Ícone de editar/renomear |
| `trash` | `delete` | Ícone de excluir |
| `list` | `list` | Ícone para visualização em lista |
| `code` | `code` | Ícone para visualização de código/texto |
| `upload` | `upload` | Ícone para upload/carregar arquivo |
| `download` | `download` | Ícone para download/salvar arquivo |
| `check` | `check` | Ícone de confirmação/salvar |
| `x` | `close` | Ícone de fechar/cancelar |
| `text` | `text_fields` | Ícone para tipo de dados texto |
| `number` | `numbers` | Ícone para tipo de dados número |
| `boolean` | `toggle_on` | Ícone para tipo de dados booleano |
| `list-square` | `view_list` | Ícone para tipo de dados lista |
| `soma` | `add` | Ícone para operação de soma |
| `subtracao` | `remove` | Ícone para operação de subtração |
| `grab-handle` | `drag_indicator` | Ícone para arrastar elementos |
| `folder` | `folder` | Ícone de pasta |

## Como funciona

1. Os ícones agora são carregados através do Google Material Icons CSS incluído no `index.html`
2. O `icon-loader.js` foi modificado para retornar HTML com a classe `material-icons` em vez de SVG
3. O mapeamento é feito através do objeto `iconMapping` no `icon-loader.js`
4. Os ícones mantêm a funcionalidade de classes CSS para tamanho e cor

## Benefícios

- **Consistência**: Uso de ícones padrão do Google Material Design
- **Performance**: Não há necessidade de carregar arquivos SVG individuais
- **Manutenção**: Ícones são mantidos pelo Google
- **Acessibilidade**: Material Icons seguem padrões de acessibilidade
- **Tamanho**: Redução no tamanho total da aplicação