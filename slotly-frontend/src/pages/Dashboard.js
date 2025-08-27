// src/pages/Dashboard.js
import React, { useRef, useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import './Dashboard.css';

export default function Dashboard() {
  // === 新增：API 基址（生产用 .env.production 配置 REACT_APP_API_BASE） ===
  const API = process.env.REACT_APP_API_BASE || '';

  const calendarRef = useRef(null);
  const token = localStorage.getItem('token');
  const isLoggedIn = !!token;

  const [events, setEvents] = useState([]);
  const [prevLoginState, setPrevLoginState] = useState(isLoggedIn); // 记录上一次登录状态

  const todayISO = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState(todayISO);
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 6);
    return d.toISOString().slice(0, 10);
  });
  const [startTime, setStartTime] = useState('09:00:00');
  const [endTime, setEndTime] = useState('18:00:00');

  const [modalOpen, setModalOpen] = useState(false);
  const [selDate, setSelDate] = useState('');
  const [selStart, setSelStart] = useState('');
  const [selEnd, setSelEnd] = useState('');
  const [desc, setDesc] = useState('');

  const [reqEmail, setReqEmail] = useState('');
  const [reqTime, setReqTime] = useState('');
  const [reqMessage, setReqMessage] = useState('');
  const [requests, setRequests] = useState([]);

  const hourOptions = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00:00`);
  const minuteOptions = Array.from({ length: 96 }, (_, i) => {
    const t = i * 15;
    const hh = Math.floor(t / 60).toString().padStart(2, '0');
    const mm = (t % 60).toString().padStart(2, '0');
    return `${hh}:${mm}:00`;
  });

  const toDate = s => {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const toLocalDate = (dateISO, time) => {
    const [y, m, d] = dateISO.split('-').map(Number);
    const [hh, mm, ss] = time.split(':').map(Number);
    return new Date(y, m - 1, d, hh, mm, ss, 0);
  };

  // 监听登录状态变化
  useEffect(() => {
    if (isLoggedIn && !prevLoginState) {
      // 从未登录 -> 登录
      fetch(`${API}/api/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mapped = data.map(e => ({
              id: String(e.id || Date.now()),
              title: e.title,
              start: e.start_time,
              end: e.end_time,
              allDay: false
            }));
            setEvents(mapped);
            sessionStorage.setItem('dashboardEvents', JSON.stringify(mapped));
          }
        })
        .catch(err => console.error('Failed to load events from backend:', err));
    }

    if (!isLoggedIn && prevLoginState) {
      // 从已登录 -> 登出
      setEvents([]);
      sessionStorage.removeItem('dashboardEvents');
    }

    setPrevLoginState(isLoggedIn);
  }, [isLoggedIn, prevLoginState, token, API]);

  // 初次加载
  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API}/api/schedule`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const mapped = data.map(e => ({
              id: String(e.id || Date.now()),
              title: e.title,
              start: e.start_time,
              end: e.end_time,
              allDay: false
            }));
            setEvents(mapped);
            sessionStorage.setItem('dashboardEvents', JSON.stringify(mapped));
          }
        })
        .catch(err => console.error('Failed to load events from backend:', err));
    } else {
      const saved = sessionStorage.getItem('dashboardEvents');
      setEvents(saved ? JSON.parse(saved) : []);
    }
  }, [isLoggedIn, token, API]);

  // 请求列表
  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API}/api/requests`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setRequests(data);
          } else if (data && Array.isArray(data.requests)) {
            setRequests(data.requests);
          } else {
            setRequests([]);
          }
        })
        .catch(err => {
          console.error('Failed to load requests', err);
          setRequests([]);
        });
    }
  }, [isLoggedIn, token, API]);

  const handleSelect = info => {
    const s = info.start, e = info.end;
    setSelDate(s.toISOString().slice(0, 10));
    setSelStart(s.toTimeString().slice(0, 8));
    setSelEnd(e.toTimeString().slice(0, 8));
    setDesc('');
    setModalOpen(true);
    info.view.calendar.unselect();
  };

  const onSave = () => {
    if (!desc.trim()) return alert('Please enter a task description');

    const startDT = toLocalDate(selDate, selStart);
    const endDT = toLocalDate(selDate, selEnd);

    const newEvent = {
      id: String(Date.now()),
      title: desc,
      start: startDT,
      end: endDT,
      allDay: false
    };

    setEvents(ev => {
      const updated = [...ev, newEvent];
      sessionStorage.setItem('dashboardEvents', JSON.stringify(updated));
      return updated;
    });

    if (isLoggedIn) {
      fetch(`${API}/api/schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          title: desc,
          start_time: startDT.toISOString(),
          end_time: endDT.toISOString()
        })
      })
        .then(async res => {
          if (!res.ok) {
            const text = await res.text();
            throw new Error(text || 'Failed to save event');
          }
          return res.json();
        })
        .then(data => {
          console.log('✅ Event saved to backend:', data);
        })
        .catch(err => {
          console.error('❌ Failed to save to backend:', err.message);
        });
    }

    setModalOpen(false);
  };

  const onReq = e => {
    e.preventDefault();
    if (!isLoggedIn) return;
    const payload = { email: reqEmail, time: reqTime, msg: reqMessage };
    fetch(`${API}/api/requests`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    })
      .then(res => res.json())
      .then(created => {
        setRequests(rs => [...rs, created]);
        setReqEmail('');
        setReqTime('');
        setReqMessage('');
      })
      .catch(err => console.error('Failed to submit request', err));
  };

  const visibleRange = {
    start: startDate,
    end: (() => {
      const d = toDate(endDate);
      d.setDate(d.getDate() + 1);
      return d.toISOString().slice(0, 10);
    })()
  };

  return (
    <div className="flex flex-col md:flex-row gap-6">
      <div className="md:w-2/3 bg-white rounded-xl shadow p-4">
        <h2 className="font-semibold text-xl mb-4">Calendar</h2>
        <div className="flex flex-wrap gap-2 mb-4">
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="border px-3 py-1 rounded" />
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="border px-3 py-1 rounded" />
          <select value={startTime} onChange={e => setStartTime(e.target.value)} className="border px-2 py-1 rounded">
            {hourOptions.map(opt => <option key={opt} value={opt}>{opt.slice(0, 5)}</option>)}
          </select>
          <select value={endTime} onChange={e => setEndTime(e.target.value)} className="border px-2 py-1 rounded">
            {hourOptions.map(opt => <option key={opt} value={opt}>{opt.slice(0, 5)}</option>)}
          </select>
        </div>

        <div className="calendar-container">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{ left: 'prev,next', center: 'title', right: '' }}
            visibleRange={visibleRange}
            slotDuration="00:30:00"
            slotMinTime={startTime}
            slotMaxTime={endTime}
            allDaySlot={false}
            editable={true}
            selectable={true}
            selectMirror={true}
            select={handleSelect}
            selectAllow={info => info.start.getDate() === info.end.getDate()}
            events={events}
            contentHeight="auto"
            aspectRatio={1.5}
            timeZone="local"
            eventContent={arg => {
              const [st, et] = arg.timeText.split(' – ');
              return (
                <div className="fc-custom-event">
                  <div className="fc-event-title">{arg.event.title}</div>
                  <div className="fc-event-time text-xs text-gray-700">
                    {st && et ? `${st} – ${et}` : arg.timeText}
                  </div>
                </div>
              );
            }}
          />
        </div>
      </div>

      <div className="md:w-1/3 flex flex-col gap-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="font-semibold text-xl mb-3">Send Your Request</h2>
          <form onSubmit={onReq} className="space-y-4">
            <input type="email" value={reqEmail} onChange={e => setReqEmail(e.target.value)} placeholder="To (email)" className="w-full border px-3 py-2 rounded" required disabled={!isLoggedIn} />
            <input type="text" value={reqTime} onChange={e => setReqTime(e.target.value)} placeholder="Preferred Time Slots" className="w-full border px-3 py-2 rounded" required disabled={!isLoggedIn} />
            <textarea value={reqMessage} onChange={e => setReqMessage(e.target.value)} placeholder="Your Message" className="w-full border px-3 py-2 rounded" required disabled={!isLoggedIn} />
            <button type="submit" className={`px-4 py-2 rounded text-white ${isLoggedIn ? 'bg-blue-600' : 'bg-gray-400 cursor-not-allowed'}`} disabled={!isLoggedIn}>
              Send
            </button>
            {!isLoggedIn && <p className="text-sm text-gray-500">Login to send requests.</p>}
          </form>
        </div>

        {isLoggedIn && (
          <div className="bg-white rounded-xl shadow p-4 flex-1 overflow-auto">
            <h2 className="font-semibold text-xl mb-3">Booking Requests Received</h2>
            <ul className="text-sm space-y-2">
              {requests.length === 0
                ? <li className="text-gray-500">No requests yet.</li>
                : requests.map((r, i) => (
                  <li key={i} className="border-b pb-1">
                    <strong>{r.email}</strong> — <em>{r.time}</em>
                    <p>{r.msg}</p>
                  </li>
                ))}
            </ul>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center" onClick={() => setModalOpen(false)}>
          <div className="bg-white rounded-xl p-6 w-80" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Add Task</h3>
            <label className="block text-sm mb-1">Date</label>
            <input type="text" value={selDate} readOnly className="w-full border px-2 py-1 rounded bg-gray-100 mb-3" />
            <label className="block text-sm mb-1">Start Time</label>
            <select value={selStart} onChange={e => setSelStart(e.target.value)} className="w-full border px-2 py-1 rounded mb-3">
              {minuteOptions.map(opt => <option key={opt} value={opt}>{opt.slice(0, 5)}</option>)}
            </select>
            <label className="block text-sm mb-1">End Time</label>
            <select value={selEnd} onChange={e => setSelEnd(e.target.value)} className="w-full border px-2 py-1 rounded mb-3">
              {minuteOptions.map(opt => <option key={opt} value={opt}>{opt.slice(0, 5)}</option>)}
            </select>
            <label className="block text-sm mb-1">Task Description</label>
            <textarea value={desc} onChange={e => setDesc(e.target.value)} className="w-full border px-2 py-1 rounded mb-4" rows={2} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setModalOpen(false)} className="px-4 py-2 rounded border">Cancel</button>
              <button onClick={onSave} className="bg-blue-600 text-white px-4 py-2 rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
