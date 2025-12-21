# Modulista

Modulista é uma SPA (Single Page Application) web para análise de dados.

## Página Inicial
A página inicial é do tipo **Lista**.

## Definições de Tipos

O sistema utiliza os seguintes tipos de dados fundamentais:

*   **Lista**: Uma sequência ordenada de zero ou mais itens.
*   **Lógico**: Um valor de verdade, podendo ser `Verdadeiro` ou `Falso`.
*   **Número**: Um valor numérico que representa uma quantidade ou magnitude.
*   **Texto**: Uma cadeia de caracteres para representação de dados textuais.
*   **Função**: Uma relação ou mapeamento que transforma valores de entrada em um valor de saída.
*   **Aplicação**: O ato de aplicar uma **Função** a seus argumentos para produzir um resultado.
*   **Valor**: A unidade básica de informação no sistema, podendo assumir qualquer um dos tipos definidos acima.

## Ambiente de Desenvolvimento

Para rodar o ambiente de desenvolvimento, é necessário ter o **Podman** e o **Podman Compose** instalados.

1.  Para iniciar a aplicação:
    ```bash
    podman-compose up
    ```

2.  Acesse a aplicação em [http://localhost:8000](http://localhost:8000).

O ambiente suporta *hot-reload*, então qualquer alteração nos arquivos `.elm` ou `index.html` será refletida automaticamente.
