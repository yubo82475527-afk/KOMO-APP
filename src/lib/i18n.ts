export const supportedLocales = ["zh-CN", "en"] as const;

export type SupportedLocale = (typeof supportedLocales)[number];

export const defaultLocale: SupportedLocale = "zh-CN";

type Dictionary = {
  common: {
    komoWorkspace: string;
    komoMember: string;
    adminPortal: string;
    backToWorkspace: string;
    view: string;
    unknown: string;
    notSet: string;
    enabled: string;
    disabled: string;
    loading: string;
    save: string;
    saving: string;
    success: string;
    retryLater: string;
  };
  nav: {
    home: string;
    approval: string;
    schedule: string;
    checkin: string;
    profile: string;
    adminSchedule: string;
    adminApproval: string;
  };
  auth: {
    signedOutTitle: string;
    signedOutDescription: string;
    emailPasswordLogin: string;
    authProvider: string;
    email: string;
    password: string;
    passwordPlaceholder: string;
    login: string;
    loggingIn: string;
    signOut: string;
    signingOut: string;
    loginHint: string;
    missingCredentials: string;
    checkingAccount: string;
    loginSuccess: string;
    loginFailed: string;
    internalOnly: string;
    initialPassword: string;
  };
  home: {
    signedOutTitle: string;
    signedOutDescription: string;
    loadErrorTitle: string;
    quickActions: Array<{ title: string; description: string; href: string }>;
    accountInfo: string;
    employeeNo: string;
    loginEmail: string;
    accountRole: string;
    welcome: string;
    unassignedDepartment: string;
    unboundEmail: string;
    noRole: string;
  };
  schedule: {
    loadErrorTitle: string;
    mySchedule: string;
    calendar: string;
    stats: string;
    prevMonth: string;
    nextMonth: string;
    realSchedule: string;
    demoSchedule: string;
    noScheduleData: string;
    shiftGuide: string;
    restDay: string;
    pendingConfig: string;
    calendarView: string;
    monthSummary: string;
    workDays: string;
    restDays: string;
    monthlyStats: string;
    shiftDistribution: string;
    detailTitle: string;
    understood: string;
    shiftName: string;
    startTime: string;
    endTime: string;
    workLocation: string;
    note: string;
    weekPreviewDays: string[];
    workedDays: string;
    scheduledDays: string;
    attendanceRate: string;
    remainingRestDays: string;
    earlyShiftRatio: string;
    middleShiftRatio: string;
    nightShiftRatio: string;
  };
  adminSchedule: {
    signedOutTitle: string;
    signedOutDescription: string;
    loadErrorTitle: string;
    noPermissionTitle: string;
    noPermissionDescription: string;
    pageTitle: string;
    approvalConfig: string;
    scheduleList: string;
    importSchedule: string;
    filters: string;
    listDemo: string;
    create: string;
    edit: string;
    delete: string;
    importGuide: string;
    importGuideBody: string;
    importGuideEncoding: string;
    downloadTemplate: string;
    importMethod: string;
    chooseCsv: string;
    filePreview: string;
    fileName: string;
    targetMonth: string;
    noFileSelected: string;
    monthUnknown: string;
    importableRows: string;
    invalidRows: string;
    importSettings: string;
    overwrite: string;
    skip: string;
    overwriteDuplicates: string;
    previewErrors: string;
    submitErrors: string;
    rowPrefix: string;
    commitImport: string;
    importing: string;
    importCompleted: string;
    csvOnly: string;
    previewEmpty: string;
  };
  approval: {
    signedOutTitle: string;
    signedOutDescription: string;
    loadErrorTitle: string;
    moduleTag: string;
    moduleTitle: string;
    moduleDescription: string;
    noTemplate: string;
    createLeaveRequest: string;
    myApproval: string;
    myRequests: string;
    pendingMine: string;
    mineTab: string;
    pendingTab: string;
    requestRecords: string;
    pendingRecords: string;
    templateManage: string;
    leaveType: string;
    days: string;
    startDate: string;
    endDate: string;
    currentStep: string;
    currentApprover: string;
    submittedAt: string;
    noMine: string;
    noPending: string;
    statuses: Record<string, string>;
    detailTitle: string;
    detailSignedOutTitle: string;
    detailSignedOutDescription: string;
    detailNotFoundTitle: string;
    detailNotFoundMessage: string;
    detailErrorTitle: string;
    applicant: string;
    dateRange: string;
    reason: string;
    progress: string;
    comment: string;
    action: string;
    actionPlaceholder: string;
    reject: string;
    approve: string;
    backToList: string;
    stepPending: string;
    stepApproved: string;
    stepRejected: string;
    stepWaiting: string;
  };
  checkin: {
    signedOutTitle: string;
    signedOutDescription: string;
    loadErrorTitle: string;
    centerTitle: string;
    unassignedDepartment: string;
    noEmployeeNo: string;
    progressDone: string;
    progressIn: string;
    progressIdle: string;
    writeAttendance: string;
    currentLocation: string;
    getLocationFirst: string;
    locationUnsupported: string;
    locating: string;
    locationReady: string;
    locationDenied: string;
    locationUnavailable: string;
    locationTimeout: string;
    latitude: string;
    longitude: string;
    accuracy: string;
    unknownAccuracy: string;
    getCurrentLocation: string;
    punchSection: string;
    punchedIn: string;
    punchIn: string;
    punchedOut: string;
    punchOut: string;
    needLocation: string;
    punchFailed: string;
    punchInSuccess: string;
    punchOutSuccess: string;
    todayRecords: string;
    noRecords: string;
    noLocation: string;
    locationPrefix: string;
  };
  profile: {
    signedOutTitle: string;
    signedOutDescription: string;
    loadErrorTitle: string;
    myAccount: string;
    records: string;
    leaveRecords: string;
    attendanceRecords: string;
    scheduleHistory: string;
    employeeStatus: string;
    role: string;
    userId: string;
    languageSetting: string;
    languageDescription: string;
    followBrowser: string;
    timezoneDisplay: string;
    timezoneDescription: string;
    timezoneValuePrefix: string;
    localeSaved: string;
    localeSaveFailed: string;
    chinese: string;
    english: string;
    normal: string;
    suspended: string;
    unassignedDepartment: string;
    unboundEmail: string;
    noEmployeeNo: string;
    noRole: string;
  };
};

export const dictionaries: Record<SupportedLocale, Dictionary> = {
  "zh-CN": {
    common: {
      komoWorkspace: "KOMO Workspace",
      komoMember: "KOMO Member",
      adminPortal: "管理端",
      backToWorkspace: "返回工作台",
      view: "查看",
      unknown: "未知",
      notSet: "未设置",
      enabled: "已启用",
      disabled: "已停用",
      loading: "加载中",
      save: "保存",
      saving: "保存中...",
      success: "成功",
      retryLater: "请稍后重试。",
    },
    nav: {
      home: "首页",
      approval: "审批",
      schedule: "排班",
      checkin: "打卡",
      profile: "我的",
      adminSchedule: "排班管理",
      adminApproval: "审批配置",
    },
    auth: {
      signedOutTitle: "登录后进入系统",
      signedOutDescription: "当前页面需要登录后才能继续使用。",
      emailPasswordLogin: "邮箱密码登录",
      authProvider: "Supabase Auth",
      email: "邮箱",
      password: "密码",
      passwordPlaceholder: "请输入密码",
      login: "登录",
      loggingIn: "登录中...",
      signOut: "退出登录",
      signingOut: "退出中...",
      loginHint: "请输入公司邮箱和密码登录。员工账号由管理员统一创建，初始密码为 Aa123456。",
      missingCredentials: "请先输入邮箱和密码。",
      checkingAccount: "正在校验账号...",
      loginSuccess: "登录成功，正在进入系统...",
      loginFailed: "登录失败，请稍后重试。",
      internalOnly: "内部员工账号暂不开放自助注册。",
      initialPassword: "首次登录请使用管理员分配的邮箱和初始密码",
    },
    home: {
      signedOutTitle: "登录后进入 OA 首页",
      signedOutDescription: "当前首页已经切换到真实 Supabase 用户，不再展示虚拟账号。",
      loadErrorTitle: "暂时无法加载首页",
      quickActions: [
        { title: "我的排班", description: "查看本月排班和班次安排。", href: "/schedule" },
        { title: "个人资料", description: "查看当前账号、工号和角色信息。", href: "/profile" },
        { title: "考勤打卡", description: "进入 KOMO 打卡模块入口。", href: "/checkin" },
        { title: "请假申请", description: "提交请假并进入真实审批流。", href: "/leave/apply" },
      ],
      accountInfo: "账号信息",
      employeeNo: "员工编号",
      loginEmail: "登录邮箱",
      accountRole: "账号角色",
      welcome: "欢迎进入 KOMO 员工工作台。",
      unassignedDepartment: "未分配部门",
      unboundEmail: "未绑定邮箱",
      noRole: "未分配角色",
    },
    schedule: {
      loadErrorTitle: "暂时无法读取排班",
      mySchedule: "我的排班",
      calendar: "排班日历",
      stats: "排班统计",
      prevMonth: "上月",
      nextMonth: "下月",
      realSchedule: "本月真实排班",
      demoSchedule: "本周示意排班",
      noScheduleData: "当前账号还没有查到本月正式排班数据。你可以通过管理端导入排班，或在 Supabase 中先补齐当前员工的 schedules 记录。",
      shiftGuide: "班次说明",
      restDay: "休息日",
      pendingConfig: "待配置",
      calendarView: "日历视图",
      monthSummary: "本月概况",
      workDays: "上班 22 天",
      restDays: "休息 9 天",
      monthlyStats: "本月统计",
      shiftDistribution: "班次分布",
      detailTitle: "班次详情",
      understood: "知道了",
      shiftName: "班次名称",
      startTime: "上班时间",
      endTime: "下班时间",
      workLocation: "工作地点",
      note: "备注",
      weekPreviewDays: ["一", "二", "三", "四", "五", "六", "日"],
      workedDays: "已排班天数",
      scheduledDays: "应上班天数",
      attendanceRate: "出勤率",
      remainingRestDays: "剩余休息日",
      earlyShiftRatio: "早班 42%",
      middleShiftRatio: "中班 28%",
      nightShiftRatio: "晚班 30%",
    },
    adminSchedule: {
      signedOutTitle: "登录后进入排班管理",
      signedOutDescription: "管理端导入排班依赖真实 Supabase 登录态和角色权限。",
      loadErrorTitle: "暂时无法进入排班管理",
      noPermissionTitle: "当前账号没有导入权限",
      noPermissionDescription: "请在 Supabase 的 user_roles 表中为当前用户分配 admin 或 hr 角色后再试。",
      pageTitle: "排班管理",
      approvalConfig: "审批配置",
      scheduleList: "排班列表",
      importSchedule: "导入排班",
      filters: "筛选器",
      listDemo: "排班列表示意",
      create: "新建",
      edit: "编辑",
      delete: "删除",
      importGuide: "导入说明",
      importGuideBody: "当前链路支持按标准排班模板导入。模板必须是宽表格式：工号、姓名、部门，然后每个日期一列，单元格填写 `ZC`、`ZB`、`WC`、`XIU` 或 `-`。",
      importGuideEncoding: "已兼容 Excel 常见中文 CSV 编码；如果仍识别不到，请优先使用下方模板重新下载后填写。",
      downloadTemplate: "下载标准模板",
      importMethod: "导入方式",
      chooseCsv: "选择标准模板 CSV 文件",
      filePreview: "文件预览",
      fileName: "文件名",
      targetMonth: "目标月份",
      noFileSelected: "尚未选择文件",
      monthUnknown: "未识别",
      importableRows: "可导入",
      invalidRows: "校验错误",
      importSettings: "导入配置",
      overwrite: "覆盖",
      skip: "跳过",
      overwriteDuplicates: "重复数据",
      previewErrors: "预览错误",
      submitErrors: "提交错误",
      rowPrefix: "第",
      commitImport: "确认导入",
      importing: "导入中...",
      importCompleted: "导入完成：成功 {success} 行，跳过 {skipped} 行。",
      csvOnly: "当前版本先支持标准 CSV 文件导入，原生 .xlsx 会在下一阶段补上。",
      previewEmpty: "没有识别到有效排班数据。请确认表头包含“工号、姓名、部门”和日期列，并尽量使用系统下载的模板。",
    },
    approval: {
      signedOutTitle: "登录后查看审批",
      signedOutDescription: "审批列表、待办和请假提交都需要真实账号登录后使用。",
      loadErrorTitle: "暂时无法加载审批",
      moduleTag: "请假审批 1.0",
      moduleTitle: "真实审批链路已启用",
      moduleDescription: "当前版本已支持真实请假申请、审批待办与结果回显。当前生效模板：{template}。",
      noTemplate: "暂未配置",
      createLeaveRequest: "发起请假申请",
      myApproval: "我的审批",
      myRequests: "我的申请",
      pendingMine: "待我处理",
      mineTab: "我的申请",
      pendingTab: "待我审批",
      requestRecords: "请假申请记录",
      pendingRecords: "审批待办",
      templateManage: "模板管理",
      leaveType: "请假类型",
      days: "天数",
      startDate: "开始",
      endDate: "结束",
      currentStep: "当前节点",
      currentApprover: "处理人",
      submittedAt: "提交时间",
      noMine: "当前还没有请假申请记录，可以先发起一条请假申请。",
      noPending: "当前没有需要你处理的审批待办。",
      statuses: {
        draft: "草稿",
        submitted: "审批中",
        waiting: "等待中",
        pending: "审批中",
        approved: "已通过",
        rejected: "已拒绝",
        cancelled: "已撤回",
      },
      detailTitle: "申请信息",
      detailSignedOutTitle: "登录后查看审批详情",
      detailSignedOutDescription: "审批详情和处理动作都需要真实账号登录后使用。",
      detailNotFoundTitle: "没有找到这条审批",
      detailNotFoundMessage: "请确认审批单链接是否正确，或返回审批列表重新进入。",
      detailErrorTitle: "暂时无法加载审批详情",
      applicant: "申请人",
      dateRange: "日期范围",
      reason: "原因",
      progress: "审批进度",
      comment: "意见",
      action: "审批操作",
      actionPlaceholder: "填写审批意见（可选）",
      reject: "拒绝",
      approve: "通过",
      backToList: "返回审批列表",
      stepPending: "待审批",
      stepApproved: "已通过",
      stepRejected: "已拒绝",
      stepWaiting: "等待中",
    },
    checkin: {
      signedOutTitle: "登录后进入打卡",
      signedOutDescription: "KOMO 打卡中心需要真实账号登录后使用。",
      loadErrorTitle: "暂时无法加载打卡页面",
      centerTitle: "KOMO 打卡中心",
      unassignedDepartment: "未分配部门",
      noEmployeeNo: "未设置工号",
      progressDone: "今日上下班打卡已完成",
      progressIn: "今日已完成上班打卡，等待下班打卡",
      progressIdle: "今日尚未打卡",
      writeAttendance: "今天的打卡记录会直接写入正式考勤表。",
      currentLocation: "当前位置",
      getLocationFirst: "请先获取当前位置，再进行上下班打卡。",
      locationUnsupported: "当前浏览器不支持定位，请换用支持定位的设备或浏览器。",
      locating: "正在获取当前位置...",
      locationReady: "定位成功，可以开始打卡。",
      locationDenied: "你拒绝了定位权限，请在浏览器里允许定位后重试。",
      locationUnavailable: "当前无法获取定位，请检查设备定位服务。",
      locationTimeout: "获取定位超时，请稍后重试。",
      latitude: "纬度",
      longitude: "经度",
      accuracy: "精度",
      unknownAccuracy: "未知",
      getCurrentLocation: "获取当前位置",
      punchSection: "上下班打卡",
      punchedIn: "已上班打卡",
      punchIn: "上班打卡",
      punchedOut: "已下班打卡",
      punchOut: "下班打卡",
      needLocation: "请先成功获取当前位置，再进行打卡。",
      punchFailed: "打卡失败，请稍后重试。",
      punchInSuccess: "上班打卡成功。",
      punchOutSuccess: "下班打卡成功。",
      todayRecords: "今日打卡记录",
      noRecords: "今天还没有打卡记录。",
      noLocation: "未记录定位信息",
      locationPrefix: "定位",
    },
    profile: {
      signedOutTitle: "登录后查看个人资料",
      signedOutDescription: "个人页会展示真实 Supabase 用户和员工档案，并支持退出登录。",
      loadErrorTitle: "暂时无法加载个人资料",
      myAccount: "我的账号",
      records: "常用记录",
      leaveRecords: "请假记录",
      attendanceRecords: "打卡记录",
      scheduleHistory: "排班历史",
      employeeStatus: "员工状态",
      role: "角色",
      userId: "用户 ID",
      languageSetting: "语言设置",
      languageDescription: "默认会跟随浏览器语言，你也可以手动保存账号偏好。",
      followBrowser: "跟随浏览器",
      timezoneDisplay: "时区显示",
      timezoneDescription: "当前页面的时间会跟随你正在使用设备的时区显示。",
      timezoneValuePrefix: "当前设备时区",
      localeSaved: "语言偏好已保存。",
      localeSaveFailed: "语言保存失败，请稍后重试。",
      chinese: "简体中文",
      english: "English",
      normal: "正常",
      suspended: "停用",
      unassignedDepartment: "未分配部门",
      unboundEmail: "未绑定邮箱",
      noEmployeeNo: "未设置工号",
      noRole: "未分配",
    },
  },
  en: {
    common: {
      komoWorkspace: "KOMO Workspace",
      komoMember: "KOMO Member",
      adminPortal: "Admin",
      backToWorkspace: "Back to Workspace",
      view: "View",
      unknown: "Unknown",
      notSet: "Not set",
      enabled: "Enabled",
      disabled: "Disabled",
      loading: "Loading",
      save: "Save",
      saving: "Saving...",
      success: "Success",
      retryLater: "Please try again later.",
    },
    nav: {
      home: "Home",
      approval: "Approval",
      schedule: "Schedule",
      checkin: "Checkin",
      profile: "Profile",
      adminSchedule: "Schedule Admin",
      adminApproval: "Approval Admin",
    },
    auth: {
      signedOutTitle: "Sign in to continue",
      signedOutDescription: "This page requires sign-in before use.",
      emailPasswordLogin: "Email & Password Sign In",
      authProvider: "Supabase Auth",
      email: "Email",
      password: "Password",
      passwordPlaceholder: "Enter your password",
      login: "Sign In",
      loggingIn: "Signing in...",
      signOut: "Sign Out",
      signingOut: "Signing out...",
      loginHint: "Use your company email and password. Employee accounts are created by admins, and the initial password is Aa123456.",
      missingCredentials: "Please enter both email and password.",
      checkingAccount: "Checking account...",
      loginSuccess: "Signed in successfully. Redirecting...",
      loginFailed: "Sign-in failed. Please try again later.",
      internalOnly: "Self-signup is not available for internal employee accounts.",
      initialPassword: "For your first login, use the email assigned by your admin and the initial password",
    },
    home: {
      signedOutTitle: "Sign in to access the OA home",
      signedOutDescription: "The home page now uses real Supabase users and no longer shows mock accounts.",
      loadErrorTitle: "Unable to load home",
      quickActions: [
        { title: "My Schedule", description: "View this month's shifts and assignments.", href: "/schedule" },
        { title: "Profile", description: "View your account, employee number, and role info.", href: "/profile" },
        { title: "Checkin", description: "Open the KOMO attendance module.", href: "/checkin" },
        { title: "Leave Request", description: "Submit leave into the live approval flow.", href: "/leave/apply" },
      ],
      accountInfo: "Account Info",
      employeeNo: "Employee No.",
      loginEmail: "Login Email",
      accountRole: "Roles",
      welcome: "Welcome to the KOMO employee workspace.",
      unassignedDepartment: "No department assigned",
      unboundEmail: "No email linked",
      noRole: "No role assigned",
    },
    schedule: {
      loadErrorTitle: "Unable to load schedule",
      mySchedule: "My Schedule",
      calendar: "Calendar",
      stats: "Stats",
      prevMonth: "Prev",
      nextMonth: "Next",
      realSchedule: "Live Schedule This Month",
      demoSchedule: "Weekly Preview",
      noScheduleData: "No live schedule was found for this month. Import schedules in the admin portal, or add schedules records for this employee in Supabase first.",
      shiftGuide: "Shift Guide",
      restDay: "Rest day",
      pendingConfig: "Pending setup",
      calendarView: "Calendar View",
      monthSummary: "Monthly Summary",
      workDays: "22 work days",
      restDays: "9 rest days",
      monthlyStats: "Monthly Stats",
      shiftDistribution: "Shift Distribution",
      detailTitle: "Shift Details",
      understood: "Got it",
      shiftName: "Shift",
      startTime: "Start",
      endTime: "End",
      workLocation: "Location",
      note: "Note",
      weekPreviewDays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      workedDays: "Scheduled Days",
      scheduledDays: "Expected Work Days",
      attendanceRate: "Attendance Rate",
      remainingRestDays: "Remaining Rest Days",
      earlyShiftRatio: "Early shift 42%",
      middleShiftRatio: "Middle shift 28%",
      nightShiftRatio: "Night shift 30%",
    },
    adminSchedule: {
      signedOutTitle: "Sign in to access schedule admin",
      signedOutDescription: "Schedule import in the admin portal requires a real signed-in Supabase session and role permissions.",
      loadErrorTitle: "Unable to access schedule admin",
      noPermissionTitle: "No import permission",
      noPermissionDescription: "Assign the current user an admin or hr role in the Supabase user_roles table and try again.",
      pageTitle: "Schedule Admin",
      approvalConfig: "Approval Admin",
      scheduleList: "Schedule List",
      importSchedule: "Import Schedule",
      filters: "Filters",
      listDemo: "Schedule List Preview",
      create: "Create",
      edit: "Edit",
      delete: "Delete",
      importGuide: "Import Guide",
      importGuideBody: "This flow supports the standard wide schedule template: employee number, name, department, then one column per date using `ZC`, `ZB`, `WC`, `XIU`, or `-`.",
      importGuideEncoding: "Common Excel CSV encodings are supported. If parsing still fails, download the system template again and refill it.",
      downloadTemplate: "Download Template",
      importMethod: "Import Method",
      chooseCsv: "Choose Standard CSV Template",
      filePreview: "File Preview",
      fileName: "File Name",
      targetMonth: "Target Month",
      noFileSelected: "No file selected",
      monthUnknown: "Unknown",
      importableRows: "Importable",
      invalidRows: "Invalid",
      importSettings: "Import Settings",
      overwrite: "Overwrite",
      skip: "Skip",
      overwriteDuplicates: "Duplicates",
      previewErrors: "Preview Errors",
      submitErrors: "Submit Errors",
      rowPrefix: "Row",
      commitImport: "Confirm Import",
      importing: "Importing...",
      importCompleted: "Import finished: {success} succeeded, {skipped} skipped.",
      csvOnly: "This version currently supports standard CSV import only. Native .xlsx support will be added later.",
      previewEmpty: "No valid schedule data was detected. Please confirm the headers include employee number, name, department, and date columns, and use the downloaded template if possible.",
    },
    approval: {
      signedOutTitle: "Sign in to view approvals",
      signedOutDescription: "Approval lists, pending tasks, and leave submission require a real signed-in account.",
      loadErrorTitle: "Unable to load approvals",
      moduleTag: "Leave Approval 1.0",
      moduleTitle: "Live approval flow enabled",
      moduleDescription: "This version supports real leave requests, approval tasks, and result feedback. Active template: {template}.",
      noTemplate: "Not configured",
      createLeaveRequest: "Create Leave Request",
      myApproval: "My Approval",
      myRequests: "My Requests",
      pendingMine: "Pending for Me",
      mineTab: "My Requests",
      pendingTab: "Pending",
      requestRecords: "Leave Request Records",
      pendingRecords: "Pending Tasks",
      templateManage: "Template Admin",
      leaveType: "Leave Type",
      days: "Days",
      startDate: "Start",
      endDate: "End",
      currentStep: "Current Step",
      currentApprover: "Approver",
      submittedAt: "Submitted",
      noMine: "You have not submitted any leave requests yet.",
      noPending: "There are no approval tasks waiting for you.",
      statuses: {
        draft: "Draft",
        submitted: "In Review",
        waiting: "Waiting",
        pending: "Pending",
        approved: "Approved",
        rejected: "Rejected",
        cancelled: "Cancelled",
      },
      detailTitle: "Request Info",
      detailSignedOutTitle: "Sign in to view approval details",
      detailSignedOutDescription: "Approval details and actions require a real signed-in account.",
      detailNotFoundTitle: "Approval not found",
      detailNotFoundMessage: "Please check whether the approval link is correct or return to the list.",
      detailErrorTitle: "Unable to load approval details",
      applicant: "Applicant",
      dateRange: "Date Range",
      reason: "Reason",
      progress: "Approval Progress",
      comment: "Comment",
      action: "Approval Action",
      actionPlaceholder: "Add a comment (optional)",
      reject: "Reject",
      approve: "Approve",
      backToList: "Back to Approval List",
      stepPending: "Pending",
      stepApproved: "Approved",
      stepRejected: "Rejected",
      stepWaiting: "Waiting",
    },
    checkin: {
      signedOutTitle: "Sign in to access checkin",
      signedOutDescription: "KOMO Checkin requires a real signed-in account.",
      loadErrorTitle: "Unable to load checkin",
      centerTitle: "KOMO Checkin Center",
      unassignedDepartment: "No department assigned",
      noEmployeeNo: "No employee number",
      progressDone: "Today's check-in and check-out are complete",
      progressIn: "Checked in today. Waiting for check-out.",
      progressIdle: "No attendance record for today yet",
      writeAttendance: "Today's records are written directly into the live attendance table.",
      currentLocation: "Current Location",
      getLocationFirst: "Get your current location before check-in or check-out.",
      locationUnsupported: "This browser does not support geolocation. Please use a supported device or browser.",
      locating: "Getting current location...",
      locationReady: "Location ready. You can check in now.",
      locationDenied: "Location permission was denied. Please allow location access in your browser and try again.",
      locationUnavailable: "Unable to get location right now. Please check device location services.",
      locationTimeout: "Location request timed out. Please try again later.",
      latitude: "Latitude",
      longitude: "Longitude",
      accuracy: "Accuracy",
      unknownAccuracy: "Unknown",
      getCurrentLocation: "Get Current Location",
      punchSection: "Attendance Action",
      punchedIn: "Checked in",
      punchIn: "Check in",
      punchedOut: "Checked out",
      punchOut: "Check out",
      needLocation: "Please get your location successfully before submitting attendance.",
      punchFailed: "Attendance submission failed. Please try again later.",
      punchInSuccess: "Check-in completed.",
      punchOutSuccess: "Check-out completed.",
      todayRecords: "Today's Records",
      noRecords: "There are no attendance records for today yet.",
      noLocation: "No location recorded",
      locationPrefix: "Location",
    },
    profile: {
      signedOutTitle: "Sign in to view your profile",
      signedOutDescription: "The profile page shows the real Supabase user and employee record, and also supports sign-out.",
      loadErrorTitle: "Unable to load profile",
      myAccount: "My Account",
      records: "Common Records",
      leaveRecords: "Leave Records",
      attendanceRecords: "Attendance Records",
      scheduleHistory: "Schedule History",
      employeeStatus: "Employee Status",
      role: "Role",
      userId: "User ID",
      languageSetting: "Language",
      languageDescription: "The app follows your browser by default, but you can save an account-level language preference here.",
      followBrowser: "Follow browser",
      timezoneDisplay: "Timezone",
      timezoneDescription: "All times on this page follow the timezone of the device you are currently using.",
      timezoneValuePrefix: "Current device timezone",
      localeSaved: "Language preference saved.",
      localeSaveFailed: "Failed to save language. Please try again later.",
      chinese: "简体中文",
      english: "English",
      normal: "Active",
      suspended: "Disabled",
      unassignedDepartment: "No department assigned",
      unboundEmail: "No email linked",
      noEmployeeNo: "No employee number",
      noRole: "Unassigned",
    },
  },
};

export function isSupportedLocale(value: string | null | undefined): value is SupportedLocale {
  return supportedLocales.includes((value ?? "") as SupportedLocale);
}

export function resolveLocaleFromAcceptLanguage(value: string | null | undefined): SupportedLocale {
  if (!value) return defaultLocale;
  const normalized = value.toLowerCase();
  if (normalized.includes("en")) return "en";
  return "zh-CN";
}

export function getDictionary(locale: SupportedLocale) {
  return dictionaries[locale];
}

export function formatMessage(template: string, values: Record<string, string>) {
  return Object.entries(values).reduce((message, [key, value]) => message.replaceAll(`{${key}}`, value), template);
}
