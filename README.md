# Simulador Iberdrola – GitHub + Vercel (passo a passo completo)

## 1. O que contém este pacote
```
index.html          o simulador (página única)
diagnostico.html    página que testa se está tudo bem configurado
api/ai.js           leitura automática de faturas e campanhas (usa a API do Claude)
api/campanhas.js    catálogo de campanhas partilhado (guarda no Upstash Redis)
campanhas.json      catálogo inicial (as 17 campanhas atuais)
folhas/*.pdf        folhas de campanha (nome do ficheiro = referência da campanha)
vercel.json         cabeçalhos e tempo máximo das funções
package.json        versão do Node
.env.example        MODELO das variáveis (NUNCA coloques chaves verdadeiras em ficheiros)
```

## 2. Contas e chaves (cria antes de começar)
1. **GitHub** (github.com) – conta gratuita.
2. **Vercel** (vercel.com) – entra com a conta do GitHub. O plano Hobby é só para uso não comercial; para uma empresa a Vercel exige o plano Pro.
3. **Chave do Claude**: console.anthropic.com > API Keys > Create Key. Copia-a logo (só aparece uma vez). Em Billing confirma que há créditos e em Limits define um limite mensal.
4. **Upstash Redis** (upstash.com): Create Database (região Europa). No separador "REST API" copia o URL e o token.
5. **Palavra-passe de administrador**: escolhe uma frase longa. Serve para publicar campanhas.

## 3. Pôr no GitHub
1. **Descompacta o zip** no teu computador (o GitHub não abre zips).
2. GitHub > New repository > nome `simulador-iberdrola` > **Private** > Create.
3. Na página do repositório: "uploading an existing file". Arrasta para lá **o conteúdo da pasta descompactada** (index.html, diagnostico.html, api, folhas, campanhas.json, vercel.json, package.json, .gitignore) – os ficheiros ficam na raiz do repositório, não dentro de outra pasta. Carrega em Commit changes.
4. Confirma no GitHub que existem `api/ai.js`, `api/campanhas.js` e a pasta `folhas/`.

## 4. Lançar na Vercel
1. Vercel > Add New > Project > escolhe o repositório > Import.
2. Framework Preset: **Other**. Deixa Build Command e Output Directory vazios. Root Directory: a raiz.
3. **Antes de carregar em Deploy**, abre "Environment Variables" e cria (a chave NÃO vai para o GitHub, só aqui):

| Nome | Valor |
|---|---|
| `ANTHROPIC_API_KEY` | a chave do Claude |
| `UPSTASH_REDIS_REST_URL` | URL do Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | token do Upstash |
| `ADMIN_KEY` | a tua palavra-passe de administrador |
| `ALLOWED_ORIGINS` | endereços do site separados por vírgula, ex. `https://simulador.rzenergy.pt,https://NOME.vercel.app` (sem barra no fim) |

   Marca Production, Preview e Development em cada uma.
4. Carrega em **Deploy**.
5. Se criares ou alterares variáveis depois do primeiro deploy, faz **Redeploy** (Deployments > último > ⋯ > Redeploy). As variáveis só entram em deploys novos.

## 5. Verificar (2 minutos)
Abre `https://O-TEU-ENDERECO/diagnostico.html`. Tem de mostrar:
- ✅ Função /api/ai – chave encontrada
- ✅ Ligação ao Claude – funciona
- ⚠️/✅ Catálogo partilhado – "ainda não há catálogo" é normal no início
- ✅ Ficheiro campanhas.json
- ✅ Folhas de campanha

Se houver ❌, a própria linha diz o que falta. Depois abre o simulador, vai ao separador **Automático**, escolhe uma fatura em PDF e carrega em "Ler fatura".

## 6. Domínio próprio e pôr no teu site
- Domínio: Vercel > Settings > Domains > Add (ex. `simulador.rzenergy.pt`) e cria no DNS o registo que a Vercel indicar. Acrescenta o domínio a `ALLOWED_ORIGINS` e faz Redeploy.
- No teu site: item de menu "Simulador Iberdrola" com link para o endereço. Em alternativa, iframe: `<iframe src="https://simulador.rzenergy.pt" style="width:100%;height:1600px;border:0"></iframe>` (se o seletor de ficheiros não abrir no iframe, usa o link).

## 7. Atualizar campanhas no dia a dia
1. Abre `https://O-TEU-ENDERECO/?admin=1` > separador **Campanhas**.
2. Escreve a palavra-passe de administrador (fica guardada no teu browser).
3. Carrega o PDF da campanha nova, confere os preços lidos e define as datas de início e fim. Fica publicado para todos. Campanhas fora de datas desaparecem sozinhas.
4. Acrescenta o PDF da folha à pasta `folhas/` no GitHub (nome = referência, ex. `MNEG265.pdf`). A Vercel republica sozinha.

## 8. Problemas comuns
| Mensagem | Causa e solução |
|---|---|
| "Falta a variável ANTHROPIC_API_KEY" | A chave não está na Vercel (Settings > Environment Variables) ou foi criada depois do deploy. Cria-a e faz Redeploy. |
| "O endereço … não está em ALLOWED_ORIGINS" | Acrescenta esse endereço exato (com https://, sem barra no fim) e faz Redeploy. |
| `/api/ai` dá 404 | A pasta `api/` não está no GitHub ou não está na raiz do repositório. |
| "erro do serviço de IA … credit/balance" | Sem créditos na conta da Anthropic (Billing). |
| "erro do serviço de IA … model" | Define `ANTHROPIC_MODEL` com um modelo disponível na tua conta. |
| Link da folha abre o simulador | O PDF não está em `folhas/` ou o nome não é igual à referência (maiúsculas incluídas). |
| "armazenamento não configurado" | Faltam as variáveis do Upstash. |

## 9. Segurança e privacidade
- Nunca escrevas a chave do Claude em ficheiros do GitHub. Se isso acontecer, apaga a chave na Anthropic e cria outra.
- Mantém o repositório privado e a `ADMIN_KEY` forte: quem a souber altera as campanhas de todos.
- O texto/foto da fatura (nome, NIF, CPE) é enviado à API da Anthropic só para extrair os dados. O histórico de propostas fica apenas no browser de quem o usa.
