import type { Language } from '../types';

export const teamNamesZh: Record<string, string> = {
  'Mexico': '墨西哥',
  'South Africa': '南非',
  'South Korea': '韩国',
  'Czech Republic': '捷克',
  'Canada': '加拿大',
  'Bosnia and Herzegovina': '波黑',
  'Qatar': '卡塔尔',
  'Switzerland': '瑞士',
  'Brazil': '巴西',
  'Morocco': '摩洛哥',
  'Haiti': '海地',
  'Scotland': '苏格兰',
  'United States': '美国',
  'Paraguay': '巴拉圭',
  'Australia': '澳大利亚',
  'Turkey': '土耳其',
  'Germany': '德国',
  'Curaçao': '库拉索',
  'Ivory Coast': '科特迪瓦',
  'Ecuador': '厄瓜多尔',
  'Netherlands': '荷兰',
  'Japan': '日本',
  'Sweden': '瑞典',
  'Tunisia': '突尼斯',
  'Belgium': '比利时',
  'Egypt': '埃及',
  'Iran': '伊朗',
  'New Zealand': '新西兰',
  'Spain': '西班牙',
  'Cape Verde': '佛得角',
  'Saudi Arabia': '沙特阿拉伯',
  'Uruguay': '乌拉圭',
  'France': '法国',
  'Senegal': '塞内加尔',
  'Iraq': '伊拉克',
  'Norway': '挪威',
  'Argentina': '阿根廷',
  'Algeria': '阿尔及利亚',
  'Austria': '奥地利',
  'Jordan': '约旦',
  'Portugal': '葡萄牙',
  'Democratic Republic of the Congo': '刚果（金）',
  'Uzbekistan': '乌兹别克斯坦',
  'Colombia': '哥伦比亚',
  'England': '英格兰',
  'Croatia': '克罗地亚',
  'Ghana': '加纳',
  'Panama': '巴拿马',
};

const uiStrings = {
  en: {
    title: 'FIFA World Cup 2026',
    subtitle: 'Schedule & Results',
    loading: 'Loading matches…',
    error: 'Failed to load schedule. Please try again.',
    retry: 'Retry',
    noMatches: 'No matches on this date',
    group: 'Group',
    match: 'Match',
    live: 'LIVE',
    halfTime: 'Half Time',
    extraTime: 'Extra Time',
    extraTimeHalfTime: 'ET HT',
    penalties: 'Pens',
    finished: 'FT',
    finishedAET: 'AET',
    finishedPenalties: 'Pens',
    scheduled: 'Scheduled',
    stadium: 'Stadium',
    loadEarlier: 'Loading earlier matches…',
    loadLater: 'Loading later matches…',
    today: 'Today',
    groupStage: 'Group Stage',
    roundOf32: 'Round of 32',
    roundOf16: 'Round of 16',
    quarterFinal: 'Quarter Final',
    semiFinal: 'Semi Final',
    thirdPlace: '3rd Place',
    final: 'Final',
    lightMode: 'Light mode',
    darkMode: 'Dark mode',
    english: 'English',
    chinese: '中文',
    update: 'Refresh schedule',
    backToSchedule: 'Back to schedule',
    teamMatches: 'Matches',
    addToCalendar: 'Add to Calendar',
    addToGoogleCalendar: 'Add to Google Calendar',
    downloadIcs: 'Download .ics (Apple / Outlook)',
    close: 'Close',
    matchDetails: 'Match Details',
    date: 'Date',
    kickoff: 'Kickoff',
    duration: 'Duration',
    hours: 'hours',
    stage: 'Stage',
    codeOfConductTitle: 'Stadium Code of Conduct',
    codeOfConductSubtitle: 'FIFA World Cup 2026™ venue rules for ticket holders',
    menu: 'Menu',
  },
  zh: {
    title: '2026 国际足联世界杯',
    subtitle: '赛程与赛果',
    loading: '正在加载比赛…',
    error: '加载赛程失败，请重试。',
    retry: '重试',
    noMatches: '该日期暂无比赛',
    group: '小组',
    match: '比赛',
    live: '直播中',
    halfTime: '中场休息',
    extraTime: '加时',
    extraTimeHalfTime: '加时中场',
    penalties: '点球',
    finished: '完场',
    finishedAET: '加时',
    finishedPenalties: '点球',
    scheduled: '未开赛',
    stadium: '球场',
    loadEarlier: '正在加载更早的比赛…',
    loadLater: '正在加载更晚的比赛…',
    today: '今天',
    groupStage: '小组赛',
    roundOf32: '32强',
    roundOf16: '16强',
    quarterFinal: '四分之一决赛',
    semiFinal: '半决赛',
    thirdPlace: '季军赛',
    final: '决赛',
    lightMode: '浅色模式',
    darkMode: '深色模式',
    english: 'English',
    chinese: '中文',
    update: '刷新赛程',
    backToSchedule: '返回赛程',
    teamMatches: '比赛',
    addToCalendar: '添加到日历',
    addToGoogleCalendar: '添加到 Google 日历',
    downloadIcs: '下载 .ics 文件（Apple / Outlook）',
    close: '关闭',
    matchDetails: '比赛详情',
    date: '日期',
    kickoff: '开球时间',
    duration: '时长',
    hours: '小时',
    stage: '阶段',
    codeOfConductTitle: '体育场行为准则',
    codeOfConductSubtitle: '2026 国际足联世界杯™ 持票观众场馆规定',
    menu: '菜单',
  },
} as const;

export type TranslationKey = keyof typeof uiStrings.en;

export function t(lang: Language, key: TranslationKey): string {
  return uiStrings[lang][key];
}

export function translateTeamName(name: string, lang: Language): string {
  if (lang === 'zh') {
    return teamNamesZh[name] ?? name;
  }
  return name;
}

export function translateKnockoutLabel(label: string, lang: Language): string {
  if (lang === 'en') return label;

  const replacements: [RegExp, string][] = [
    [/Winner Group ([A-L])/g, '小组$1头名'],
    [/Runner-up Group ([A-L])/g, '小组$1次名'],
    [/Winner Match (\d+)/g, '第$1场胜者'],
    [/Loser Match (\d+)/g, '第$1场负者'],
    [/3rd Group/g, '小组第三'],
    [/Winner/g, '胜者'],
    [/Runner-up/g, '次名'],
    [/Loser/g, '负者'],
  ];

  let result = label;
  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement);
  }
  return result;
}

export function translateMatchType(type: string, lang: Language): string {
  const map: Record<string, TranslationKey> = {
    group: 'groupStage',
    r32: 'roundOf32',
    r16: 'roundOf16',
    qf: 'quarterFinal',
    sf: 'semiFinal',
    third: 'thirdPlace',
    final: 'final',
  };
  const key = map[type];
  return key ? t(lang, key) : type;
}
