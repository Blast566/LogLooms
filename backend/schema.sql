Create ExTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE project(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    api_key VARCHAR(64) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE logs(
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES project(id) ON DELETE CASCADE,
    level VARCHAR(10) NOT NULL CHECK (level IN ('INFO', 'WARN', 'ERROR', 'DEBUG')),
    message TEXT NOT NULL,
    stack_trace TEXT,
    environment VARCHAR(50) DEFAULT 'production',
    metadata JSONB Default '{}' :: jsonb,
    timeestamp TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_logs_project_timestamp ON logs(project_id, timestamp DESC);
CREATE INDEX idx_logs_level ON logs(level);