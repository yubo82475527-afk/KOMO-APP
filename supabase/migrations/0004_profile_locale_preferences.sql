alter table public.profiles
  add column if not exists preferred_locale text;

update public.profiles
set preferred_locale = 'zh-CN'
where preferred_locale is null;

alter table public.profiles
  add constraint profiles_preferred_locale_check
  check (preferred_locale in ('zh-CN', 'en'));
