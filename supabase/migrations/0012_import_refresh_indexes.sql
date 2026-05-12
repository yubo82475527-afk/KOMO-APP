create index if not exists sales_records_reference_no_idx on public.sales_records(reference_no);
create index if not exists sales_records_document_reference_idx on public.sales_records(document_no, reference_no);
