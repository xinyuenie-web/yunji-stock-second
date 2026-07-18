/**
 * 云基公司二次股权激励管理系统 – 初始数据
 *
 * 激励计划基本信息
 */
const PLAN_INFO = {
  name:            '云基公司2024年二次股权激励计划',
  boardDate:       '2024-03-15',
  shareholderDate: '2024-04-10',
  grantDate:       '2024-05-01',
  exercisePrice:   12.50,       // 元/股
  validYears:      4,
  // 归属比例：第1年末30%，第2年末30%，第3年末40%
  vestingRatios:   [0.30, 0.30, 0.40],
  vestingDates:    ['2025-05-01', '2026-05-01', '2027-05-01'],
};

/**
 * 激励对象名册（二次授予）
 * status: 'active' | 'resigned' | 'pending'
 */
let targets = [
  { id:'YJ00101', name:'张伟',   dept:'研发中心',   title:'首席技术官',     level:'高级管理层',   shares:200000, status:'active'  },
  { id:'YJ00102', name:'李娜',   dept:'研发中心',   title:'技术总监',       level:'中级管理层',   shares:100000, status:'active'  },
  { id:'YJ00103', name:'王磊',   dept:'研发中心',   title:'高级工程师',     level:'核心技术人员', shares: 60000, status:'active'  },
  { id:'YJ00104', name:'刘洋',   dept:'研发中心',   title:'高级工程师',     level:'核心技术人员', shares: 60000, status:'active'  },
  { id:'YJ00105', name:'陈晨',   dept:'研发中心',   title:'工程师',         level:'核心技术人员', shares: 40000, status:'active'  },
  { id:'YJ00106', name:'赵雪',   dept:'产品部',     title:'产品总监',       level:'中级管理层',   shares: 80000, status:'active'  },
  { id:'YJ00107', name:'孙浩',   dept:'产品部',     title:'高级产品经理',   level:'核心技术人员', shares: 50000, status:'active'  },
  { id:'YJ00108', name:'周丽',   dept:'产品部',     title:'产品经理',       level:'其他关键岗位', shares: 30000, status:'active'  },
  { id:'YJ00109', name:'吴强',   dept:'市场部',     title:'市场副总裁',     level:'高级管理层',   shares:120000, status:'active'  },
  { id:'YJ00110', name:'郑芳',   dept:'市场部',     title:'市场总监',       level:'中级管理层',   shares: 70000, status:'active'  },
  { id:'YJ00111', name:'钱林',   dept:'市场部',     title:'品牌经理',       level:'其他关键岗位', shares: 30000, status:'active'  },
  { id:'YJ00112', name:'冯明',   dept:'运营部',     title:'运营总监',       level:'中级管理层',   shares: 80000, status:'active'  },
  { id:'YJ00113', name:'褚华',   dept:'运营部',     title:'高级运营经理',   level:'其他关键岗位', shares: 40000, status:'active'  },
  { id:'YJ00114', name:'卫玲',   dept:'财务部',     title:'首席财务官',     level:'高级管理层',   shares:120000, status:'active'  },
  { id:'YJ00115', name:'蒋超',   dept:'财务部',     title:'财务总监',       level:'中级管理层',   shares: 60000, status:'active'  },
  { id:'YJ00116', name:'沈婷',   dept:'人力资源部', title:'人力资源总监',   level:'中级管理层',   shares: 60000, status:'active'  },
  { id:'YJ00117', name:'韩刚',   dept:'人力资源部', title:'高级HR经理',     level:'其他关键岗位', shares: 30000, status:'active'  },
  { id:'YJ00118', name:'杨帆',   dept:'研发中心',   title:'架构师',         level:'核心技术人员', shares: 80000, status:'active'  },
  { id:'YJ00119', name:'朱健',   dept:'研发中心',   title:'高级工程师',     level:'核心技术人员', shares: 60000, status:'resigned'},
  { id:'YJ00120', name:'秦丹',   dept:'产品部',     title:'UX设计总监',     level:'核心技术人员', shares: 50000, status:'active'  },
];

/**
 * 行权记录
 * status: 'completed' | 'pending' | 'cancelled'
 */
let exerciseRecords = [
  { seq:1, targetId:'YJ00101', date:'2025-06-01', shares:60000, price:12.50, period:1, status:'completed' },
  { seq:2, targetId:'YJ00102', date:'2025-06-05', shares:30000, price:12.50, period:1, status:'completed' },
  { seq:3, targetId:'YJ00103', date:'2025-06-10', shares:18000, price:12.50, period:1, status:'completed' },
  { seq:4, targetId:'YJ00104', date:'2025-06-10', shares:18000, price:12.50, period:1, status:'completed' },
  { seq:5, targetId:'YJ00109', date:'2025-06-15', shares:36000, price:12.50, period:1, status:'completed' },
  { seq:6, targetId:'YJ00114', date:'2025-06-15', shares:36000, price:12.50, period:1, status:'completed' },
  { seq:7, targetId:'YJ00106', date:'2025-07-01', shares:24000, price:12.50, period:1, status:'completed' },
  { seq:8, targetId:'YJ00118', date:'2025-07-05', shares:24000, price:12.50, period:1, status:'pending'   },
];
