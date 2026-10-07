-- Rollout barrier: apply ONLY after server upload has been deployed and verified.
-- Older web builds otherwise cannot upload. No native direct uploads currently exist.
drop policy if exists business_assets_insert on storage.objects;
