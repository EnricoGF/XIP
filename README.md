# XIP

Aplicação web de finanças pessoais desenvolvida com React e Vite. O projeto usa Firebase para autenticação e armazenamento de dados.

## Requisitos

- Node.js 20.19+ ou 22.12+
- npm
- Um projeto Firebase com Authentication e Firestore configurados

## Configuração

1. Clone o repositório e entre na pasta do projeto:

   ```bash
   git clone https://github.com/EnricoGF/XIP.git
   cd XIP
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

3. Confira a configuração do Firebase em `src/services/firebase.js`. O arquivo contém a configuração web usada pela aplicação. Para conectar outro projeto Firebase, atualize esses valores com os dados do seu projeto.
4. No Firebase Console, habilite o provedor Google em **Authentication** e configure os domínios autorizados para incluir `localhost`.
5. Crie ou selecione um banco de dados no **Cloud Firestore**.

## Executar em desenvolvimento

Inicie o servidor local:

```bash
npm run dev
```

Abra [http://localhost:4173](http://localhost:4173) no navegador. O servidor está configurado para usar essa porta e falhar caso ela já esteja ocupada.

## Verificações e build

Para executar o linter:

```bash
npm run lint
```

Para gerar a versão de produção:

```bash
npm run build
```

Os arquivos gerados ficam na pasta `dist/`. Para servir o build localmente:

```bash
npm run preview
```
