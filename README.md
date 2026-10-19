# Simulador Iberdrola – GitHub + Vercel (passo a passo completo)

## 1. O que contém este pacote
```
index.html          o simulador (página única)
diagnostico.html    página que testa se está tudo bem configurado
api/ai.js           leitura automática de faturas e campanhas (usa a API da Groq)
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
3. **Chave da Groq**: console.groq.com > API Keys > Create API Key. Copia-a logo (só aparece uma vez). Confirma os limites do teu plano em console.groq.com (Settings > Limits).
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
| `GROQ_API_KEY` | a chave da Groq |
| `UPSTASH_REDIS_REST_URL` | URL do Upstash |
| `UPSTASH_REDIS_REST_TOKEN` | token do Upstash |
| `ADMIN_KEY` | a tua palavra-passe de administrador |
| `ALLOWED_ORIGINS` | endereços do site separados por vírgula, ex. `https://simulador.rzenergy.pt,https://NOME.vercel.app` (sem barra no fim) |
| `GROQ_MODEL` | (opcional) modelo para texto; por defeito `llama-3.3-70b-versatile` |
| `GROQ_VISION_MODEL` | (opcional) modelo para fotos; por defeito `meta-llama/llama-4-scout-17b-16e-instruct` |

   Marca Production, Preview e Development em cada uma.
4. Carrega em **Deploy**.
5. Se criares ou alterares variáveis depois do primeiro deploy, faz **Redeploy** (Deployments > último > ⋯ > Redeploy). As variáveis só entram em deploys novos.

## 5. Verificar (2 minutos)
Abre `https://O-TEU-ENDERECO/diagnostico.html`. Tem de mostrar:
- ✅ Função /api/ai – chave encontrada
- ✅ Ligação à Groq – funciona
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
| "Falta a variável GROQ_API_KEY" | A chave não está na Vercel (Settings > Environment Variables) ou foi criada depois do deploy. Cria-a e faz Redeploy. |
| "O endereço … não está em ALLOWED_ORIGINS" | Acrescenta esse endereço exato (com https://, sem barra no fim) e faz Redeploy. |
| `/api/ai` dá 404 | A pasta `api/` não está no GitHub ou não está na raiz do repositório. |
| "Limite de pedidos/tokens da Groq atingido" | Espera um minuto ou aumenta o plano da Groq. O plano gratuito tem limites baixos por minuto. |
| "erro do serviço de IA … model" | Define `GROQ_MODEL` / `GROQ_VISION_MODEL` com um modelo disponível na tua conta (lista em console.groq.com/docs/models). |
| Leitura de foto falha | O modelo de imagem tem de suportar visão (por defeito Llama 4 Scout). Fotos grandes: tira com menos resolução (limite ~4 MB). |
| Link da folha abre o simulador | O PDF não está em `folhas/` ou o nome não é igual à referência (maiúsculas incluídas). |
| "armazenamento não configurado" | Faltam as variáveis do Upstash. |

## 9. Segurança e privacidade
- Nunca escrevas a chave da Groq em ficheiros do GitHub. Se isso acontecer, apaga a chave na Groq (console.groq.com/keys) e cria outra.
- Mantém o repositório privado e a `ADMIN_KEY` forte: quem a souber altera as campanhas de todos.
- O texto/foto da fatura (nome, NIF, CPE) é enviado à API da Groq só para extrair os dados. O histórico de propostas fica apenas no browser de quem o usa.
