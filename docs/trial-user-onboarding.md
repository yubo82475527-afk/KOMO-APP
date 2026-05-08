# Trial User Onboarding

本文用于小范围试运行期间的员工开户与权限配置。目标是让每个试运行账号都能稳定完成：

`Auth 用户 -> profiles -> user_roles -> 登录验证`

## 1. 创建 Auth 用户

在 Supabase 控制台进入 `Authentication > Users > Add user`：

- 邮箱：员工公司邮箱
- 密码：`Aa123456`
- 邮箱验证：内部试运行可由管理员直接确认

创建后，记录该用户的 `auth.users.id`。

## 2. 写入员工档案

`profiles.id` 必须和 `auth.users.id` 完全一致，不能只靠邮箱匹配。

```sql
insert into public.profiles (
  id,
  employee_no,
  full_name,
  email,
  department_id,
  status
) values (
  'AUTH_USER_UUID',
  'E1001',
  '张三',
  'user@example.com',
  null,
  'active'
)
on conflict (id) do update set
  employee_no = excluded.employee_no,
  full_name = excluded.full_name,
  email = excluded.email,
  department_id = excluded.department_id,
  status = excluded.status;
```

## 3. 绑定角色

先确认 `roles` 表已有基础角色：`admin`、`hr`、`manager`、`employee`。

员工账号通常至少需要 `employee`。管理导入账号需要额外绑定 `admin` 或 `hr`。

```sql
insert into public.user_roles (profile_id, role_id)
select 'AUTH_USER_UUID', id
from public.roles
where code = 'employee'
on conflict do nothing;
```

管理员示例：

```sql
insert into public.user_roles (profile_id, role_id)
select 'AUTH_USER_UUID', id
from public.roles
where code in ('employee', 'admin')
on conflict do nothing;
```

## 4. 验证项目内登录

登录后检查：

- 首页可以显示真实姓名、邮箱、角色
- `/profile` 可以显示员工档案
- `/schedule` 可以正常读取该员工本月排班
- 管理账号访问 `/admin/schedule` 不会被拦截

## 5. 常见问题

### 页面提示“没有关联员工档案”

优先检查：

- `profiles.id` 是否等于 `auth.users.id`
- `profiles.email` 是否和登录邮箱一致
- 用户是否登录到了正确账号

### 管理端提示“没有导入权限”

检查：

- `user_roles.profile_id` 是否等于该员工的 `profiles.id`
- 是否绑定了 `admin` 或 `hr`

### 排班页面没有数据

检查：

- `schedules.profile_id` 是否等于该员工的 `profiles.id`
- `work_date` 是否在当前月份
- `shift_template_id` 是否能关联到 `shift_templates`
