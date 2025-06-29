-- 002_tree_structure.sql
-- 階層構造のためのカラムとトリガーを追加

-- Add tree structure columns to documents table
ALTER TABLE documents ADD COLUMN tree_path TEXT DEFAULT '';
ALTER TABLE documents ADD COLUMN level INTEGER DEFAULT 0;
ALTER TABLE documents ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Tree structure indexes
CREATE INDEX idx_documents_tree_path ON documents(tree_path);
CREATE INDEX idx_documents_parent_level ON documents(parent_id, level);
CREATE INDEX idx_documents_sort_order ON documents(user_id, parent_id, sort_order);

-- Function to update tree path
CREATE OR REPLACE FUNCTION update_document_tree_path()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.tree_path := NEW.id::TEXT;
        NEW.level := 0;
    ELSE
        SELECT tree_path || '.' || NEW.id::TEXT, level + 1 
        INTO NEW.tree_path, NEW.level
        FROM documents 
        WHERE id = NEW.parent_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update tree path
CREATE TRIGGER trigger_update_tree_path
    BEFORE INSERT OR UPDATE ON documents
    FOR EACH ROW
    EXECUTE FUNCTION update_document_tree_path();
