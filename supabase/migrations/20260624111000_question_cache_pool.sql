-- A cache bucket can hold multiple portable questions. The lookup key remains
-- ontology_leaf_id + mode + difficulty; questions rotate by least hit_count.
alter table public.question_bank
  drop constraint if exists question_bank_ontology_leaf_id_mode_difficulty_key;

create unique index if not exists question_bank_normalized_text_idx
  on public.question_bank (ontology_leaf_id, mode, difficulty, lower(btrim(question_text)));

comment on table public.question_bank is
  'Portable question pools keyed by ontology leaf, mode, and difficulty. Runtime company, role, and JD context is never stored here.';
