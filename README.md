# Herbora

Aplicativo educativo sobre chás e plantas: reúne informações introdutórias sobre usos tradicionais, preparo, compostos, cuidados e combinações. O conteúdo não é aconselhamento médico e não substitui avaliação profissional.

## Proposta

- **Problema:** informações sobre plantas e chás aparecem dispersas e podem omitir cuidados importantes, como contraindicações e possíveis interações.
- **Contexto e público:** pessoas interessadas em conhecer plantas e preparações tradicionais, que precisam consultar informações introdutórias em um só lugar.
- **Justificativa:** reunir as informações por espécie facilita a consulta e destaca cuidados que podem passar despercebidos em conteúdos isolados.
- **Solução:** um aplicativo mobile educativo com catálogo pesquisável, fichas organizadas por planta e avisos para consulta responsável.
- **Níveis de acesso:** visitante sem login (consulta informações públicas), usuário com conta (acessa os detalhes completos e seus recursos pessoais) e administrador (gerencia o catálogo e também pode usar os recursos de conta).

## Requisitos funcionais

- **RF01:** listar e pesquisar plantas pelo nome popular ou científico.
- **RF02:** abrir a ficha de uma planta e consultar resumo, uso tradicional, preparo, compostos, cuidados e combinações.
- **RF03:** cadastrar uma conta de usuário com consentimento para armazenar nome e e-mail.
- **RF04:** autenticar e encerrar a sessão de um usuário.
- **RF05:** permitir ao usuário autenticado salvar e remover plantas favoritas.
- **RF06:** manter o histórico das plantas abertas pela conta.
- **RF07:** criar, consultar, atualizar e remover anotações privadas por planta.
- **RF08:** permitir ao usuário consultar e editar nome e e-mail do perfil.
- **RF09:** permitir que somente administradores cadastrem, editem e desativem plantas.
- **RF10:** impedir o cadastro de espécies com nome científico já existente.

## Dados e permissões

O banco MySQL usa as seguintes entidades:

| Entidade | Campos principais | Finalidade |
|---|---|---|
| `users` | `id`, `name`, `email`, `password_hash`, `role`, `privacy_consent_at`, `created_at` | Contas, credenciais protegidas por hash, nível de acesso e registro do consentimento. O e-mail é único; o papel autenticado é `member` ou `admin`. Visitantes não têm cadastro no banco. |
| `plants` | `id`, `nome_popular`, `nome_cientifico`, `categoria`, `resumo`, `uso_tradicional`, `preparo`, `compostos`, `cuidados`, `combinacoes`, `active`, `created_at`, `updated_at` | Fichas educativas do catálogo. O nome científico é único; `active` permite retirar uma ficha do catálogo sem apagar o registro. |
| `plant_favorites` | `user_id`, `plant_id`, `created_at` | Favoritos privados de cada usuário com conta. |
| `plant_history` | `user_id`, `plant_id`, `last_viewed_at` | Última visualização de cada planta por usuário, sem acumular linhas repetidas. |
| `plant_notes` | `user_id`, `plant_id`, `note`, `created_at`, `updated_at` | Anotação privada de cada usuário para uma planta. |

Visitantes sem login consultam nome, categoria, resumo, uso/benefícios tradicionais e contraindicações/cuidados; a API não envia preparo, compostos e combinações nessa modalidade. Usuários autenticados (`member`) recebem os detalhes completos, podem gerenciar seus próprios favoritos, histórico, anotações e perfil. Administradores (`admin`) têm esses recursos e as operações de gerenciamento do catálogo. O cadastro público sempre cria `member`; somente uma operação administrativa controlada pode promover uma conta a `admin`.

## Telas e fluxo

1. **Início:** apresenta a proposta e os avisos educativos; permite abrir o catálogo ou a conta.
2. **Plantas:** busca e lista o catálogo da API; se a API estiver desligada, mostra plantas de demonstração e informa isso na tela.
3. **Detalhes:** exibe usos tradicionais, preparo, compostos, cuidados e combinações.
4. **Minha conta:** cadastro, login, saída da sessão e consulta/edição do perfil; mostra recursos conforme o papel.
5. **Minha área (usuário com conta):** consulta favoritos, histórico e anotações pessoais.
6. **Gerenciar plantas (administrador):** lista as plantas e organiza cadastro/edição em identificação, visão geral, uso e preparo, compostos e cuidados, e combinações. A desativação preserva o registro no banco.

**Fluxo principal:** Início → Plantas → busca/seleção → Detalhes. Visitantes leem as informações públicas; podem entrar/criar conta para acessar os detalhes completos e recursos pessoais. Administradores também podem seguir para Gerenciar plantas.

## Requisitos

- Node.js 20 ou superior e npm.
- MySQL 8.
- Expo Go ou emulador Android/iOS.

## Banco de dados e API

1. Crie um usuário e uma senha próprios no MySQL. Não use credenciais reais em arquivos versionados.
2. Execute o script `backend/database/schema.sql` no MySQL Workbench. A carga inicial procura cada espécie antes de inseri-la, portanto repetir o script não reinsere plantas que já existem.
3. Para um banco criado antes da restrição contra duplicatas, execute também `backend/database/cleanup_duplicates.sql` no Workbench, conectado com um usuário que possa alterar tabelas. A migração remove apenas linhas com todos os dados iguais (mantendo o menor ID) e cria uma chave única pelo nome científico. Registros diferentes não são apagados; se uma espécie possuir conteúdos diferentes, revise-os antes de aplicar a chave.
4. Se estiver atualizando um banco já existente, faça backup e execute `backend/database/member_features_migration.sql` uma vez no Workbench, com um usuário que possa alterar tabelas. A migração converte o papel antigo `customer` para `member` sem apagar contas e cria as tabelas de favoritos, histórico e anotações.
5. Copie `backend/.env.example` para `backend/.env` e preencha as configurações locais do MySQL. O exemplo usa `localhost`, a porta `3307` e o usuário `herbora`; ajuste `DB_PORT`, `DB_USER` e `DB_PASSWORD` conforme sua instalação. Defina `JWT_SECRET` com um segredo aleatório de pelo menos 32 caracteres.
6. Instale e inicie a API:

   ```bash
   cd backend
   npm install
   npm start
   ```

7. Acesse `http://localhost:3000/api/health` para confirmar que API e banco conectaram.

### Testes da API e integração

Com a pasta `backend` como diretório atual, execute os testes automatizados de autenticação/autorização:

```bash
npm test
```

Para validar o fluxo real com MySQL, mantenha a API (`npm start`) rodando em outro terminal e execute:

```bash
npm run test:integration
```

O teste usa as configurações de `backend/.env` e `http://localhost:3000/api` por padrão. Pode-se substituir o endereço com `HERBORA_API_URL`. Ele testa saúde da conexão, consentimento, cadastro, hash da senha, login, JWT, papéis, bloqueio de usuário comum, recursos pessoais e CRUD de planta. Para isso, cria um usuário e uma planta temporários com identificadores únicos e os remove ao terminar; não usa nem apaga contas ou plantas existentes. Execute apenas contra o banco local de desenvolvimento depois de aplicar a migração de recursos pessoais.

### Rotas

| Método | Rota | Acesso | Descrição |
|---|---|---|---|
| GET | `/api/health` | Público | Verifica a API e a conexão ao banco |
| POST | `/api/auth/register` | Público | Cadastra usuário `member`; senha armazenada com bcrypt |
| POST | `/api/auth/login` | Público | Valida credenciais e retorna JWT |
| GET | `/api/auth/me` | JWT | Retorna o usuário da sessão |
| PUT | `/api/auth/me` | JWT | Atualiza nome e e-mail do próprio perfil |
| GET | `/api/plants` | Público/JWT | Visitante e usuário comum recebem campos públicos; administrador recebe detalhes para gerenciar |
| GET | `/api/plants/:id` | Público/JWT | Visitante recebe campos públicos; usuário autenticado recebe detalhes completos |
| POST | `/api/plants` | Administrador | Cadastra uma planta |
| PUT | `/api/plants/:id` | Administrador | Atualiza uma planta |
| DELETE | `/api/plants/:id` | Administrador | Desativa uma planta sem apagar o registro |
| GET | `/api/account/plants/:plantId` | JWT | Consulta estado pessoal da planta (favorito e anotação) |
| GET/POST/DELETE | `/api/account/favorites[/:plantId]` | JWT | Lista, adiciona ou remove favoritos |
| GET/POST | `/api/account/history[/:plantId]` | JWT | Consulta histórico ou registra uma visualização |
| GET/PUT/DELETE | `/api/account/notes[/:plantId]` | JWT | Consulta, salva ou remove anotações próprias |

A comunicação entre o app e a API usa `fetch()` por meio do helper `apiRequest` em `services/api.js`. As rotas de consulta retornam os dados do MySQL; quando a API não está disponível, a tela Plantas informa a situação e usa o catálogo demonstrativo local.

O cadastro público sempre cria um usuário `member` e exige consentimento para armazenar nome, e-mail e os dados de personalização (favoritos, histórico e anotações); a data é registrada em `privacy_consent_at`. A senha é armazenada com bcrypt, e o login emite um JWT com validade de duas horas. O app envia o token como `Bearer` nas rotas protegidas e salva-o no armazenamento seguro nativo. O logout remove o token deste dispositivo.

Para preparar um administrador no banco local de desenvolvimento, cadastre uma conta e altere seu papel com uma operação SQL controlada: `UPDATE users SET role = 'admin' WHERE email = 'email-da-conta';`. Saia e entre novamente para obter um token com o novo papel; a conta administrativa passa a mostrar **Gerenciar catálogo de plantas**. Nunca disponibilize essa permissão na tela de cadastro. Após a migração, usuários já conectados devem sair e entrar novamente para receber um JWT com o novo papel `member`.

O formulário de gerenciamento está separado por assunto e pode cadastrar, editar ou desativar plantas; cada ficha exige nome popular, nome científico, categoria, resumo, uso tradicional, preparo, compostos, cuidados e combinações. O nome científico deve identificar uma planta uma única vez.

Após executar a migração de duplicatas, o nome científico possui uma restrição única no MySQL. O CRUD retorna `409 Conflict` se uma tentativa de criação ou alteração duplicar uma espécie já cadastrada.

## Aplicativo

Na raiz do projeto:

```bash
npm install
```

Copie `.env.example` para `.env` e configure `EXPO_PUBLIC_API_URL`. `http://localhost:3000/api` funciona no navegador e no emulador Android padrão. Em um celular físico, `localhost` aponta para o próprio celular: conecte computador e celular à mesma rede Wi-Fi e use o IPv4 local do computador, por exemplo `http://192.168.0.10:3000/api`. Libere a porta 3000 no firewall se necessário. Inicie o Expo com `npm start`.

O token é salvo no armazenamento seguro do dispositivo nativo. Na versão web, fica somente em memória e é perdido ao recarregar a página.

## Conteúdo e segurança

O catálogo inicial é demonstrativo e deve ser revisado com fontes confiáveis antes de qualquer uso público. As informações não prometem efeitos terapêuticos e alertam que espécie, preparo, combinações, saúde e medicamentos podem alterar riscos. Não publique dados pessoais, senhas, tokens ou arquivos `.env`.
