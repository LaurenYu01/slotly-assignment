// src/pages/Checklist.js
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Chart from 'chart.js/auto';

export default function Checklist() {
  // === 新增：API 基址（生产用 .env.production 配置 REACT_APP_API_BASE） ===
  const API = process.env.REACT_APP_API_BASE || '';

  const [tasks, setTasks] = useState([]);
  const [desc, setDesc] = useState('');
  const [stats, setStats] = useState([]);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  // ===== Storage helpers (游客用 sessionStorage) =====
  const GUEST_KEY = 'guest_tasks';

  const readGuestTasks = () => {
    try {
      const raw = sessionStorage.getItem(GUEST_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  const writeGuestTasks = (arr) => {
    try {
      sessionStorage.setItem(GUEST_KEY, JSON.stringify(arr));
    } catch {}
  };

  // 日期工具
  const todayStr = new Date().toISOString().slice(0, 10);
  const addDays = (isoDate, n) => {
    const d = new Date(isoDate + 'T00:00:00');
    d.setDate(d.getDate() + n);
    return d.toISOString().slice(0, 10);
  };
  const tomorrowStr = addDays(todayStr, 1);

  // —— 首次：把旧的 localStorage.guest_tasks 迁回 sessionStorage（只迁一次） —— //
  useEffect(() => {
    if (!isLoggedIn) {
      try {
        const hasSession = sessionStorage.getItem(GUEST_KEY);
        const legacyLocal = localStorage.getItem(GUEST_KEY);
        if (!hasSession && legacyLocal) {
          sessionStorage.setItem(GUEST_KEY, legacyLocal);
          localStorage.removeItem(GUEST_KEY);
        }
      } catch {}
    }
  }, [isLoggedIn]);

  // —— 规范化任务 —— //
  const normalizeTasks = (arr) =>
    (Array.isArray(arr) ? arr : []).map((t) => ({
      id: t.id,
      title: t.title ?? t.desc ?? '',
      status: t.status || 'pending',
      dueDate: t.dueDate || todayStr,  // 当前归属日期
      movedAt: t.movedAt || null,      // 何时执行了“move to tomorrow”
    }));

  // —— 拉取任务 & 统计 —— //
  const fetchTasks = () => {
    if (!isLoggedIn) {
      const guest = normalizeTasks(readGuestTasks());
      setTasks(guest);
      return;
    }
    fetch(`${API}/api/tasks`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setTasks(normalizeTasks(data)))
      .catch(() => setTasks([]));
  };

  const fetchStats = () => {
    if (!isLoggedIn) return;
    fetch(`${API}/api/tasks/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => res.json())
      .then(data => setStats(Array.isArray(data) ? data : []))
      .catch(() => setStats([]));
  };

  useEffect(() => {
    fetchTasks();
    fetchStats();
  }, [isLoggedIn, token]); // eslint 可能提示依赖；为保持行为，这里不变

  // 游客：任何变更落盘到 sessionStorage（刷新/路由切换可保留；关闭标签页即清空）
  useEffect(() => {
    if (!isLoggedIn) {
      writeGuestTasks(tasks);
    }
  }, [tasks, isLoggedIn]);

  // —— 仅展示“今天”的任务（主列表）—— //
  const todayTasks = useMemo(
    () => tasks.filter((t) => (t.dueDate || todayStr) === todayStr),
    [tasks, todayStr]
  );

  // —— “Move to tomorrow” 分组（展示被移动到明天的任务）—— //
  const movedToTomorrowList = useMemo(
    () => tasks.filter(t => t.status === 'move to tomorrow' && (t.dueDate === tomorrowStr)),
    [tasks, tomorrowStr]
  );

  // —— 今日完成率（统一口径：done / (done + missed + move to tomorrow)）—— //
  // 本地口径（未登录或后端缺失时使用）
  const doneLocal = todayTasks.filter(t => t.status === 'done').length;
  const missedLocal = todayTasks.filter(t => t.status === 'skipped').length;

  // moved 本地口径：统计“今天执行了 move”的数量（不依赖 dueDate）
  const movedTodayLocal = tasks.filter(
    t => t.status === 'move to tomorrow' && t.movedAt === todayStr
  ).length;

  const denomLocal = doneLocal + missedLocal + movedTodayLocal;
  const completionLocal = denomLocal ? Math.round((doneLocal / denomLocal) * 100) : 0;

  // 登录后：优先使用后端的 done/skipped/move；若后端的 move 缺失或滞后，用本地 movedTodayLocal 兜底
  let completionToday = completionLocal;
  if (isLoggedIn && stats.length > 0) {
    const s = stats.find(x => x.date === todayStr);
    if (s) {
      const sd = parseInt(s.done || 0);
      const sm = parseInt(s.skipped || 0);
      const stBackend = s['move to tomorrow'] ?? s.postponed ?? s.moveToTomorrow ?? 0;
      const st = parseInt(stBackend || 0);
      const movedForToday = st || movedTodayLocal; // 后端优先，否则用本地兜底
      const denom = sd + sm + movedForToday;
      completionToday = denom ? Math.round((sd / denom) * 100) : 0;
    }
  }

  // —— 同步任务到后端（登录态）—— //
  const syncAllIfLoggedIn = (next) => {
    if (!isLoggedIn) return Promise.resolve();
    return fetch(`${API}/api/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ tasks: next })
    }).catch(err => console.warn('❌ Failed to sync', err));
  };

  // —— 交互：新增 —— //
  const addTask = async () => {
    const text = desc.trim();
    if (!text) return;
    const newTask = { id: Date.now(), title: text, status: 'pending', dueDate: todayStr, movedAt: null };
    const updatedTasks = [...tasks, newTask];
    setTasks(updatedTasks);
    if (!isLoggedIn) writeGuestTasks(updatedTasks);
    setDesc('');
    await syncAllIfLoggedIn(updatedTasks);
    fetchStats(); // 立刻刷新统计
  };

  // —— 交互：状态变更 —— //
  const changeStatus = async (id, newStatus) => {
    const updated = tasks.map(t => (t.id === id ? { ...t, status: newStatus } : t));
    setTasks(updated);
    if (!isLoggedIn) writeGuestTasks(updated);
    await syncAllIfLoggedIn(updated);
    fetchStats(); // 立刻刷新统计
  };

  // —— 交互：移动到明天 —— //
  const moveToTomorrow = async (id) => {
    const updated = tasks.map(t => {
      if (t.id !== id) return t;
      const baseDate = t.dueDate || todayStr;
      return {
        ...t,
        dueDate: addDays(baseDate, 1),
        status: 'move to tomorrow',
        movedAt: todayStr, // 关键：记录今天做了 move
      };
    });
    setTasks(updated);
    if (!isLoggedIn) writeGuestTasks(updated);
    await syncAllIfLoggedIn(updated);
    fetchStats(); // 立刻刷新统计（若后端滞后，本地兜底也能立即生效）
  };

  // —— 交互：删除 —— //
  const deleteTask = async (id) => {
    if (!window.confirm('Delete this task?')) return;
    const updated = tasks.filter(t => t.id !== id);
    setTasks(updated);
    if (!isLoggedIn) writeGuestTasks(updated);

    if (isLoggedIn) {
      await fetch(`${API}/api/tasks/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => console.warn('❌ Failed to delete', err));
      // 如果后端用“整表覆盖”保存，也可以改成：await syncAllIfLoggedIn(updated);
      fetchStats();
    }
  };

  // —— 统计图（同一口径；登录优先用后端，否则用本地；对 move 使用本地兜底）—— //
  useEffect(() => {
    const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const todayIndex = new Date().getDay();

    let doneCount = 0;
    let missedCount = 0;
    let movedCount = 0;

    if (isLoggedIn && stats.length > 0) {
      const todayStats = stats.find(s => s.date === todayStr);
      if (todayStats) {
        doneCount = parseInt(todayStats.done || 0);
        missedCount = parseInt(todayStats.skipped || 0);
        const stBackend = todayStats['move to tomorrow'] ?? todayStats.postponed ?? todayStats.moveToTomorrow ?? 0;
        movedCount = parseInt(stBackend || 0);
      }
      // 后端若没有 moved 的最新值，则用本地 movedAt 兜底
      if (!movedCount) {
        movedCount = movedTodayLocal;
      }
    } else {
      // 未登录：全部使用本地口径
      doneCount = doneLocal;
      missedCount = missedLocal;
      movedCount = movedTodayLocal;
    }

    const denom = doneCount + missedCount + movedCount;
    const pct = denom ? Math.round((doneCount / denom) * 100) : 0;
    const data = days.map((_, i) => (i === todayIndex ? pct : 0));

    if (chartRef.current) {
      chartRef.current.destroy();
      chartRef.current = null;
    }

    const ctx = canvasRef.current.getContext('2d');
    chartRef.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: days,
        datasets: [{
          label: 'Completion %',
          data,
          borderColor: '#3b82f6',
          fill: false
        }]
      },
      options: {
        scales: {
          y: { min: 0, max: 100, ticks: { callback: v => v + '%' } }
        }
      }
    });
  }, [isLoggedIn, stats, todayStr, doneLocal, missedLocal, movedTodayLocal]);

  // 图标
  const Icon = {
    Check: (props) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M5 13l4 4L19 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    X: (props) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    Clock: (props) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
        <path d="M12 7v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Trash: (props) => (
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
        <path d="M3 6h18M8 6V4h8v2m-1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
    Dot: (props) => (
      <svg viewBox="0 0 8 8" aria-hidden="true" {...props}>
        <circle cx="4" cy="4" r="4" />
      </svg>
    ),
  };

  // 圆形渐变按钮 + 独立 tooltip（group/btn 作用域）
  const IconBtn = ({ title, onClick, from, to, ring, children }) => {
    const base = 'relative inline-flex items-center justify-center w-9 h-9 rounded-full text-white shadow-sm transition-transform duration-150 ease-out hover:scale-[1.05] active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1';
    return (
      <div className="relative inline-block group/btn">
        <button
          onClick={onClick}
          title={title}
          aria-label={title}
          className={`${base} focus:${ring}`}
          style={{ background: `linear-gradient(135deg, ${from}, ${to})` }}
        >
          {children}
        </button>
        <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded-md text-[11px] font-medium text-white bg-black/70 opacity-0 translate-y-1 group-hover/btn:opacity-100 group-hover/btn:translate-y-0 transition">
          {title}
        </div>
      </div>
    );
  };

  // 行强调颜色（左侧竖条）
  const styleByStatus = (status) => {
    switch (status) {
      case 'done':
        return { bar: 'bg-emerald-500' };
      case 'skipped':
        return { bar: 'bg-rose-500' };
      case 'move to tomorrow':
        return { bar: 'bg-amber-500' };
      default:
        return { bar: 'bg-slate-300' };
    }
  };

  // 状态徽章（仅在需要时显示）
  const StatusBadge = ({ status }) => {
    const label =
      status === 'done' ? 'Done' :
      status === 'skipped' ? 'Missed' :
      status === 'move to tomorrow' ? 'Move to tomorrow' :
      'Pending';
    const color =
      status === 'done' ? 'bg-emerald-50 text-emerald-700' :
      status === 'skipped' ? 'bg-rose-50 text-rose-700' :
      status === 'move to tomorrow' ? 'bg-amber-50 text-amber-700' :
      'bg-slate-50 text-slate-700';
    const IconCmp =
      status === 'done' ? Icon.Check :
      status === 'skipped' ? Icon.X :
      status === 'move to tomorrow' ? Icon.Clock : Icon.Dot;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${color}`}>
        <IconCmp className="w-3.5 h-3.5" />
        {label}
      </span>
    );
  };

  // 单行：showStatus 控制徽章
  const Row = ({ t, showStatus = true }) => {
    const s = styleByStatus(t.status);
    return (
      <div className="relative rounded-lg border bg-white hover:bg-gray-50 transition">
        <span className={`absolute left-0 top-0 bottom-0 w-1.5 rounded-l-lg ${s.bar}`} />
        <div className="flex justify-between items-center pl-4 pr-2 py-2">
          <div className="min-w-0">
            <div className="font-medium truncate">{t.title}</div>
            {showStatus && (
              <div className="mt-1">
                <StatusBadge status={t.status} />
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {t.status === 'pending' && (
              <>
                <IconBtn title="Done" from="#81E6D9" to="#38B2AC" ring="ring-emerald-200" onClick={() => changeStatus(t.id, 'done')}>
                  <Icon.Check className="w-4 h-4" />
                </IconBtn>
                <IconBtn title="Missed" from="#FEB2B2" to="#E53E3E" ring="ring-rose-200" onClick={() => changeStatus(t.id, 'skipped')}>
                  <Icon.X className="w-4 h-4" />
                </IconBtn>
                <IconBtn
                  title="Move to tomorrow"
                  from="#FBD38D"
                  to="#DD6B20"
                  ring="ring-amber-200"
                  onClick={() => moveToTomorrow(t.id)}
                >
                  <Icon.Clock className="w-4 h-4" />
                </IconBtn>
              </>
            )}
            <IconBtn title="Delete" from="#CBD5E0" to="#718096" ring="ring-slate-200" onClick={() => deleteTask(t.id)}>
              <Icon.Trash className="w-4 h-4" />
            </IconBtn>
          </div>
        </div>
      </div>
    );
  };

  // 仅渲染“今天”的三组
  const pending = useMemo(() => todayTasks.filter(t => t.status === 'pending'), [todayTasks]);
  const done = useMemo(() => todayTasks.filter(t => t.status === 'done'), [todayTasks]);
  const skipped = useMemo(() => todayTasks.filter(t => t.status === 'skipped'), [todayTasks]);

  // 组头（标题 + 数量 Chip）
  const SectionTitle = ({ colorClasses, title, count }) => (
    <div className="flex items-center justify-between mb-2">
      <h3 className={`font-semibold ${colorClasses.text}`}>{title}</h3>
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colorClasses.chip}`}>{count}</span>
    </div>
  );

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* 左侧：任务列表 */}
      <div className="w-full md:w-2/3 bg-white rounded-xl border shadow-sm p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Task Checklist</h2>
          <div className="px-2 py-1 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            Today: <span className="font-semibold">{completionToday}%</span>
          </div>
        </div>

        {/* 输入区 */}
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={desc}
            onChange={e => setDesc(e.target.value)}
            placeholder="Add a task…"
            className="border rounded-lg px-3 py-2 flex-grow focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <button
            onClick={addTask}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:opacity-90"
          >
            Add
          </button>
        </div>

        {/* Pending 区块（现在行内不再显示 “Pending” 徽章） */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-slate-700">Pending</h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">{pending.length}</span>
          </div>
          <div className="space-y-2">
            {pending.length ? pending.map(t => <Row key={t.id} t={t} showStatus={false} />) : (
              <div className="text-gray-500 text-sm">No pending tasks for today. Add one above.</div>
            )}
          </div>
        </div>

        {/* 其它分组：分组里本就隐藏状态字样 */}
        <div className="grid md:grid-cols-3 gap-4 text-sm">
          {/* Done */}
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-3">
            <SectionTitle
              colorClasses={{ text: 'text-emerald-700', chip: 'bg-emerald-100 text-emerald-700' }}
              title="Done"
              count={done.length}
            />
            <div className="space-y-2">
              {done.length ? done.map(t => <Row key={t.id} t={t} showStatus={false} />) : <div className="text-emerald-700/70">No items</div>}
            </div>
          </div>

          {/* Missed */}
          <div className="rounded-lg border border-rose-200 bg-rose-50/50 p-3">
            <SectionTitle
              colorClasses={{ text: 'text-rose-700', chip: 'bg-rose-100 text-rose-700' }}
              title="Missed"
              count={skipped.length}
            />
            <div className="space-y-2">
              {skipped.length ? skipped.map(t => <Row key={t.id} t={t} showStatus={false} />) : <div className="text-rose-700/70">No items</div>}
            </div>
          </div>

          {/* Move to tomorrow（展示被移动到明天的任务） */}
          <div className="rounded-lg border border-amber-200 bg-amber-50/50 p-3">
            <SectionTitle
              colorClasses={{ text: 'text-amber-700', chip: 'bg-amber-100 text-amber-700' }}
              title="Move to tomorrow"
              count={movedToTomorrowList.length}
            />
            <div className="space-y-2">
              {movedToTomorrowList.length
                ? movedToTomorrowList.map(t => <Row key={t.id} t={t} showStatus={false} />)
                : <div className="text-amber-700/70">No items</div>}
            </div>
          </div>
        </div>
      </div>

      {/* 右侧：统计图 */}
      <div className="w-full md:w-1/3 bg-white rounded-xl border shadow-sm p-4">
        <h2 className="text-lg font-semibold mb-2">Task Completion Statistics</h2>
        <canvas ref={canvasRef} className="w-full h-48" />
      </div>
    </div>
  );
}
