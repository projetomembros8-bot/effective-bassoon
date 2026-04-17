# GITHUB PAGES DEPLOYS

Este projeto está configurado para o GitHub Pages.

## Como corrigir a "Tela Branca" no GitHub Pages:

A tela branca acontece porque o GitHub Pages serve o site em uma subpasta (como `/effective-bassoon/`). 

### O que eu fiz para você:
1. **Configuração de Caminho Relativo:** Atualizei o arquivo `vite.config.ts` com `base: './'`. Isso garante que o site encontre os arquivos de estilo e script em qualquer pasta.
2. **Automação de Deploy:** Criei um arquivo em `.github/workflows/deploy.yml`. 

### Como ativar o deploy automático:
1. Suba todos os arquivos para o seu repositório no GitHub.
2. Vá em **Settings** (Configurações) do seu repositório no GitHub.
3. Clique em **Pages** na lateral esquerda.
4. Em **Build and deployment** > **Source**, mude para **GitHub Actions**.
5. Agora, toda vez que você enviar código novo, o GitHub vai construir e publicar o site sozinho!

---

## Desenvolvimento Local

```bash
npm install
npm run dev
```

## Gerar Versão para Produção (Manual)

```bash
npm run build
```
O resultado estará na pasta `dist`. Você deve subir o **conteúdo** da pasta `dist` para o diretório raiz do seu repositório ou branch de deploy.
