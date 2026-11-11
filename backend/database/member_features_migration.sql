USE herbora;

ALTER TABLE users
  MODIFY role ENUM('customer', 'member', 'admin') NOT NULL DEFAULT 'member';

UPDATE users
SET role = 'member'
WHERE role = 'customer';

ALTER TABLE users
  MODIFY role ENUM('member', 'admin') NOT NULL DEFAULT 'member';

CREATE TABLE IF NOT EXISTS plant_favorites (
  user_id BIGINT UNSIGNED NOT NULL,
  plant_id BIGINT UNSIGNED NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, plant_id),
  KEY idx_plant_favorites_plant (plant_id),
  CONSTRAINT fk_plant_favorites_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_plant_favorites_plant FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plant_history (
  user_id BIGINT UNSIGNED NOT NULL,
  plant_id BIGINT UNSIGNED NOT NULL,
  last_viewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, plant_id),
  KEY idx_plant_history_plant (plant_id),
  CONSTRAINT fk_plant_history_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_plant_history_plant FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS plant_notes (
  user_id BIGINT UNSIGNED NOT NULL,
  plant_id BIGINT UNSIGNED NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, plant_id),
  KEY idx_plant_notes_plant (plant_id),
  CONSTRAINT fk_plant_notes_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT fk_plant_notes_plant FOREIGN KEY (plant_id) REFERENCES plants (id) ON DELETE CASCADE
);
