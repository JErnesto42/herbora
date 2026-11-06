# Herbora

Aplicativo educativo sobre chás e plantas: reúne informações introdutórias sobre usos tradicionais, preparo, compostos, cuidados e combinações. O conteúdo não é aconselhamento médico e não substitui avaliação profissional.

## Proposta

- **Problema:** informações sobre plantas e chás aparecem dispersas e podem omitir cuidados importantes, como contraindicações e possíveis interações.
- **Contexto e público:** pessoas interessadas em conhecer plantas e preparações tradicionais, que precisam consultar informações introdutórias em um só lugar.
- **Justificativa:** reunir as informações por espécie facilita a consulta e destaca cuidados que podem passar despercebidos em conteúdos isolados.
- **Solução:** um aplicativo mobile educativo com catálogo pesquisável, fichas organizadas por planta e avisos para consulta responsável.
- **Níveis de usuário:** cliente (consulta o catálogo e mantém uma conta) e administrador (gerencia as fichas de plantas).

## Requisitos funcionais

- **RF01:** listar e pesquisar plantas pelo nome popular ou científico.
- **RF02:** abrir a ficha de uma planta e consultar resumo, uso tradicional, preparo, compostos, cuidados e combinações.
- **RF03:** cadastrar uma conta de cliente com consentimento para armazenar nome e e-mail.
- **RF04:** autenticar e encerrar a sessão de um usuário.
- **RF05:** permitir que somente administradores cadastrem, editem e desativem plantas.
- **RF06:** impedir o cadastro de espécies com nome científico já existente.

## Dados e permissões

O banco MySQL usa duas entidades:

| Entidade | Campos principais | Finalidade |
|---|---|---|
| `users` | `id`, `name`, `email`, `password_hash`, `role`, `privacy_consent_at`, `created_at` | Contas, credenciais protegidas por hash, nível de acesso e registro do consentimento. O e-mail é único; o papel é `customer` ou `admin`. |
| `plants` | `id`, `nome_popular`, `nome_cientifico`, `categoria`, `resumo`, `uso_tradicional`, `preparo`, `compostos`, `cuidados`, `combinacoes`, `active`, `created_at`, `updated_at` | Fichas educativas do catálogo. O nome científico é único; `active` permite retirar uma ficha do catálogo sem apagar o registro. |

O cliente acessa as rotas públicas de consulta e as rotas da própria conta. As operações de escrita do catálogo exigem JWT válido e papel `admin`, verificado pela API. O cadastro público não permite escolher o próprio papel.

## Telas e fluxo

1. **Início:** apresenta a proposta e os avisos educativos; permite abrir o catálogo ou a conta.
2. **Plantas:** busca e lista o catálogo da API; se a API estiver desligada, mostra plantas de demonstração e informa isso na tela.
3. **Detalhes:** exibe usos tradicionais, preparo, compostos, cuidados e combinações.
4. **Minha conta:** cadastro, login e saída da sessão; após o login, mostra as opções compatíveis com o papel do usuário.
5. **Gerenciar plantas (administrador):** lista as plantas e organiza cadastro/edição em identificação, visão geral, uso e preparo, compostos e cuidados, e combinações. A desativação preserva o registro no banco.

**Fluxo principal:** Início → Plantas → busca/seleção → Detalhes. O cadastro e login ficam em Minha conta; administradores autenticados podem seguir para Gerenciar plantas.

## Requisitos

- Node.js 20 ou superior e npm.
- MySQL 8.
- Expo Go ou emulador Android/iOS.

## Banco de dados e API

1. Crie um usuário e uma senha próprios no MySQL. Não use credenciais reais em arquivos versionados.
2. Execute o script `backend/database/schema.sql` no MySQL Workbench. A carga inicial procura cada espécie antes de inseri-la, portanto repetir o script não reinsere plantas que já existem.
3. Para um banco criado antes da restrição contra duplicatas, execute também `backend/database/cleanup_duplicates.sql` no Workbench, conectado com um usuário que possa alterar tabelas. A migração remove apenas linhas com todos os dados iguais (mantendo o menor ID) e cria uma chave única pelo nome científico. Registros diferentes não são apagados; se uma espécie possuir conteúdos diferentes, revise-os antes de aplicar a chave.
4. Copie `backend/.env.example` para `backend/.env` e preencha as configurações locais do MySQL. Defina `JWT_SECRET` com um segredo aleatório de pelo menos 32 caracteres.
5. Instale e inicie a API:

   ```bash
   cd backend
   npm install
   npm start
   ```

6. Acesse `http://localhost:3000/api/health` para confirmar que API e banco conectaram.

### Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/health` | Público | Verifica a API e a conexão ao banco |
| POST | `/api/auth/register` | Público | Cadastra cliente; senha armazenada com bcrypt |
| POST | `/api/auth/login` | Público | Valida credenciais e retorna JWT |
| GET | `/api/auth/me` | JWT | Retorna o usuário da sessão |
| GET | `/api/plants` | Público | Lista plantas ativas |
| GET | `/api/plants/:id` | Público | Consulta uma planta |
| POST | `/api/plants` | Administrador | Cadastra uma planta |
| PUT | `/api/plants/:id` | Administrador | Atualiza uma planta |
| DELETE | `/api/plants/:id` | Administrador | Desativa uma planta sem apagar o registro |

A comunicação entre o app e a API usa `fetch()` por meio do helper `apiRequest` em `services/api.js`. As rotas de consulta retornam os dados do MySQL; quando a API não está disponível, a tela Plantas informa a situação e usa o catálogo demonstrativo local.

O cadastro público sempre cria um cliente e exige consentimento para armazenar nome e e-mail; a data é registrada em `privacy_consent_at`. Para preparar um administrador no banco local de desenvolvimento, cadastre uma conta e altere seu papel com uma operação SQL controlada: `UPDATE users SET role = 'admin' WHERE email = 'email-da-conta';`. Nunca disponibilize essa permissão na tela de cadastro.

Depois de atribuir o papel `admin` no MySQL, saia da conta no app e faça login novamente. A conta administrativa passa a mostrar **Gerenciar catálogo de plantas**. O formulário está separado por assunto e pode cadastrar, editar ou desativar plantas; cada ficha exige nome popular, nome científico, categoria, resumo, uso tradicional, preparo, compostos, cuidados e combinações. O nome científico deve identificar uma planta uma única vez.

Após executar a migração de duplicatas, o nome científico possui uma restrição única no MySQL. O CRUD retorna `409 Conflict` se uma tentativa de criação ou alteração duplicar uma espécie já cadastrada.

## Aplicativo

Na raiz do projeto:

```bash
npm install
```

Copie `.env.example` para `.env` e configure `EXPO_PUBLIC_API_URL`. `http://localhost:3000/api` funciona no navegador e pode precisar ser substituído pelo IP da rede local do computador ao testar em um celular físico. Inicie o Expo com `npm start`.

O token é salvo no armazenamento seguro do dispositivo nativo. Na versão web, fica somente em memória e é perdido ao recarregar a página.

## Conteúdo e segurança

O catálogo inicial é demonstrativo e deve ser revisado com fontes confiáveis antes de qualquer uso público. As informações não prometem efeitos terapêuticos e alertam que espécie, preparo, combinações, saúde e medicamentos podem alterar riscos. Não publique dados pessoais, senhas, tokens ou arquivos `.env`.
