export const HOME_LEVELS = [
  { level:1,label:"Cozy cottage",price:0,indoor:12,garden:2,width:78 },
  { level:2,label:"Room to grow",price:80,indoor:20,garden:6,width:83 },
  { level:3,label:"Garden house",price:180,indoor:32,garden:10,width:88 },
  { level:4,label:"Dream home",price:350,indoor:48,garden:16,width:94 },
  { level:5,label:"Garden villa",price:600,indoor:64,garden:24,width:97 },
  { level:6,label:"Grand estate",price:950,indoor:80,garden:32,width:100 },
] as const;
export const homeLevel = (level=1) => HOME_LEVELS[Math.max(0,Math.min(HOME_LEVELS.length-1,level-1))];
