CREATE DATABASE IF NOT EXISTS herbora
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE herbora;

CREATE TABLE IF NOT EXISTS users (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  name VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('customer', 'admin') NOT NULL DEFAULT 'customer',
  privacy_consent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
);

CREATE TABLE IF NOT EXISTS plants (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  nome_popular VARCHAR(120) NOT NULL,
  nome_cientifico VARCHAR(180) NOT NULL,
  categoria VARCHAR(60) NOT NULL,
  resumo TEXT NOT NULL,
  uso_tradicional TEXT NOT NULL,
  preparo TEXT NOT NULL,
  compostos TEXT NOT NULL,
  cuidados TEXT NOT NULL,
  combinacoes TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_plants_nome_cientifico (nome_cientifico),
  KEY idx_plants_active_name (active, nome_popular)
);

DELETE duplicate
FROM plants AS duplicate
INNER JOIN plants AS original
  ON duplicate.id > original.id
  AND BINARY duplicate.nome_popular = BINARY original.nome_popular
  AND BINARY duplicate.nome_cientifico = BINARY original.nome_cientifico
  AND BINARY duplicate.categoria = BINARY original.categoria
  AND BINARY duplicate.resumo = BINARY original.resumo
  AND BINARY duplicate.uso_tradicional = BINARY original.uso_tradicional
  AND BINARY duplicate.preparo = BINARY original.preparo
  AND BINARY duplicate.compostos = BINARY original.compostos
  AND BINARY duplicate.cuidados = BINARY original.cuidados
  AND BINARY duplicate.combinacoes = BINARY original.combinacoes
  AND duplicate.active = original.active;

SET @plants_unique_index_exists = (
  SELECT COUNT(*)
  FROM information_schema.statistics
  WHERE table_schema = DATABASE()
    AND table_name = 'plants'
    AND index_name = 'uq_plants_nome_cientifico'
);
SET @plants_unique_index_sql = IF(
  @plants_unique_index_exists = 0,
  'ALTER TABLE plants ADD UNIQUE KEY uq_plants_nome_cientifico (nome_cientifico)',
  'SELECT 1'
);
PREPARE plants_unique_index_statement FROM @plants_unique_index_sql;
EXECUTE plants_unique_index_statement;
DEALLOCATE PREPARE plants_unique_index_statement;

INSERT INTO plants
  (nome_popular, nome_cientifico, categoria, resumo, uso_tradicional, preparo, compostos, cuidados, combinacoes)
SELECT seed.nome_popular, seed.nome_cientifico, seed.categoria, seed.resumo,
       seed.uso_tradicional, seed.preparo, seed.compostos, seed.cuidados, seed.combinacoes
FROM (
  SELECT
   'Camomila' AS nome_popular, 'Matricaria chamomilla' AS nome_cientifico, 'FLORES' AS categoria,
   'Uma flor aromática muito conhecida em preparações tradicionais.' AS resumo,
   'Tradicionalmente consumida como infusão e apreciada por seu aroma suave.' AS uso_tradicional,
   'A infusão é preparada com flores secas e água quente. Siga as orientações da embalagem.' AS preparo,
   'Apigenina e bisabolol são compostos estudados na camomila.' AS compostos,
   'Pode causar reação em pessoas sensíveis a plantas da família Asteraceae. Gestantes, lactantes e pessoas que usam medicamentos devem conversar com um profissional de saúde.' AS cuidados,
   'Adicionar outros ingredientes pode alterar sabor e composição. A segurança da combinação depende de cada planta e da pessoa.' AS combinacoes
  UNION ALL
  SELECT
   'Hortelã', 'Mentha spicata', 'FOLHAS',
   'Folhas de aroma fresco, usadas em bebidas e receitas.',
   'Usada tradicionalmente em infusões e também como ingrediente culinário.' AS uso_tradicional,
   'Use folhas limpas em água quente; o tempo de infusão altera o aroma e o sabor.' AS preparo,
   'Mentol e carvona são compostos aromáticos encontrados em diferentes espécies de Mentha.' AS compostos,
   'Espécies de hortelã têm composições distintas. Pessoas com condições de saúde ou que usam medicamentos devem consultar um profissional.' AS cuidados,
   'Limão, gengibre e outras plantas mudam o perfil de sabor; isso não comprova benefício terapêutico nem garante segurança.' AS combinacoes
  UNION ALL
  SELECT
   'Gengibre', 'Zingiber officinale', 'RAÍZES',
   'Rizoma de sabor marcante, presente em bebidas e na culinária.',
   'Ingrediente culinário e de bebidas tradicionais em diferentes culturas.' AS uso_tradicional,
   'Pode ser usado fresco ou seco em uma preparação quente; a intensidade depende da quantidade e do tempo.' AS preparo,
   'Gingeróis e shogaóis são compostos característicos do gengibre e podem variar com o processamento.' AS compostos,
   'O uso pode não ser adequado para todas as pessoas ou junto a certos medicamentos. Peça orientação individual a um profissional de saúde.' AS cuidados,
   'A combinação com outras plantas ou ingredientes altera sabor e exposição aos compostos; não há garantia de efeito ou segurança.' AS combinacoes
) AS seed
WHERE NOT EXISTS (
  SELECT 1
  FROM plants AS existing
  WHERE existing.nome_cientifico = seed.nome_cientifico
);
