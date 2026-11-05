USE herbora;

START TRANSACTION;

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

COMMIT;

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
