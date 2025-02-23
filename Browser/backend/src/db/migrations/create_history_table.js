module.exports = `
CREATE TABLE history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  title TEXT,
  visit_count INTEGER DEFAULT 1,
  last_visit_time TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_history_user_id ON history(user_id);
CREATE INDEX idx_history_url ON history(url);
CREATE INDEX idx_history_last_visit_time ON history(last_visit_time);
`; 