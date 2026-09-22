import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { eventService } from '../services/eventService';
import { adminService } from '../services/adminService';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Badge } from '../components/common/Badge';
import { useToast } from '../context/ToastContext';

export const AdminDashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: toastError, info } = useToast();

  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'events' | 'users'
  const [events, setEvents] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Dynamic 6-month trailing generator ending on the current month
  const getTrailing6Months = () => {
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const fullMonths = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];

    const now = new Date();
    const months = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        short: shortMonths[d.getMonth()],
        full: fullMonths[d.getMonth()],
        year: d.getFullYear(),
        isCurrent: i === 0,
        label: `${shortMonths[d.getMonth()]} ${d.getFullYear()}`
      });
    }
    return months;
  };

  const trailingMonths = getTrailing6Months();
  const currentMonthInfo = trailingMonths[5];
  const startMonthInfo = trailingMonths[0];

  // Interactive Graph Controls & State
  const [activeMetric, setActiveMetric] = useState('rsvps'); // 'rsvps' | 'visitors' | 'events'
  const [chartMode, setChartMode] = useState('curve'); // 'curve' | 'bars'
  const [hoveredMonthIndex, setHoveredMonthIndex] = useState(null);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(5); // Default to current month (index 5)

  const METRIC_CONFIGS = {
    rsvps: {
      label: 'RSVPs & Confirmed Admissions',
      unit: 'RSVPs',
      peakPrefix: '🔥 Peak:',
      series: [
        { raw: 14200, count: '14.2k', growth: '+12%', events: 24, topCat: 'Music & Gigs', cx: 40, cy: 125, height: '42%' },
        { raw: 19400, count: '19.4k', growth: '+36%', events: 31, topCat: 'Food & Pop-ups', cx: 120, cy: 98, height: '57%' },
        { raw: 18100, count: '18.1k', growth: '-6%', events: 28, topCat: 'Arts & Culture', cx: 200, cy: 105, height: '53%' },
        { raw: 24600, count: '24.6k', growth: '+35%', events: 39, topCat: 'Music & Gigs', cx: 280, cy: 72, height: '72%' },
        { raw: 29300, count: '29.3k', growth: '+19%', events: 44, topCat: 'Workshops & Runs', cx: 360, cy: 48, height: '86%' },
        { raw: 34120, count: '34.1k', growth: '+16%', events: 52, topCat: 'Music & Festivals', cx: 440, cy: 22, height: '100%', highlight: true }
      ],
      curve: "M 40 125 C 80 125, 80 98, 120 98 C 160 98, 160 105, 200 105 C 240 105, 240 72, 280 72 C 320 72, 320 48, 360 48 C 400 48, 400 22, 440 22",
      area: "M 40 125 C 80 125, 80 98, 120 98 C 160 98, 160 105, 200 105 C 240 105, 240 72, 280 72 C 320 72, 320 48, 360 48 C 400 48, 400 22, 440 22 L 440 150 L 40 150 Z"
    },
    visitors: {
      label: 'Platform Discovery Visits & Radar Traffic',
      unit: 'Visits',
      peakPrefix: '🚀 Peak:',
      series: [
        { raw: 38500, count: '38.5k', growth: '+18%', events: 24, topCat: 'Search & Radar', cx: 40, cy: 120, height: '42%' },
        { raw: 49000, count: '49.0k', growth: '+27%', events: 31, topCat: 'Map Discovery', cx: 120, cy: 92, height: '53%' },
        { raw: 46200, count: '46.2k', growth: '-5%', events: 28, topCat: 'Social Shares', cx: 200, cy: 100, height: '50%' },
        { raw: 64800, count: '64.8k', growth: '+40%', events: 39, topCat: 'Map Radar', cx: 280, cy: 62, height: '70%' },
        { raw: 78100, count: '78.1k', growth: '+21%', events: 44, topCat: 'Direct Invites', cx: 360, cy: 40, height: '84%' },
        { raw: 92500, count: '92.5k', growth: '+18%', events: 52, topCat: 'Hyperlocal Radar', cx: 440, cy: 18, height: '100%', highlight: true }
      ],
      curve: "M 40 120 C 80 120, 80 92, 120 92 C 160 92, 160 100, 200 100 C 240 100, 240 62, 280 62 C 320 62, 320 40, 360 40 C 400 40, 400 18, 440 18",
      area: "M 40 120 C 80 120, 80 92, 120 92 C 160 92, 160 100, 200 100 C 240 100, 240 62, 280 62 C 320 62, 320 40, 360 40 C 400 40, 400 18, 440 18 L 440 150 L 40 150 Z"
    },
    events: {
      label: 'New Local Events Published & Hosted',
      unit: 'Events',
      peakPrefix: '⚡ Peak:',
      series: [
        { raw: 24, count: '24', growth: '+8%', events: 24, topCat: 'Indie Jams', cx: 40, cy: 110, height: '46%' },
        { raw: 31, count: '31', growth: '+29%', events: 31, topCat: 'Flea Markets', cx: 120, cy: 85, height: '60%' },
        { raw: 28, count: '28', growth: '-9%', events: 28, topCat: 'Clay Workshops', cx: 200, cy: 96, height: '54%' },
        { raw: 39, count: '39', growth: '+39%', events: 39, topCat: 'Tech Mixers', cx: 280, cy: 60, height: '75%' },
        { raw: 44, count: '44', growth: '+13%', events: 44, topCat: 'Art Walks', cx: 360, cy: 45, height: '85%' },
        { raw: 52, count: '52', growth: '+18%', events: 52, topCat: 'Music & Culinary', cx: 440, cy: 24, height: '100%', highlight: true }
      ],
      curve: "M 40 110 C 80 110, 80 85, 120 85 C 160 85, 160 96, 200 96 C 240 96, 240 60, 280 60 C 320 60, 320 45, 360 45 C 400 45, 400 24, 440 24",
      area: "M 40 110 C 80 110, 80 85, 120 85 C 160 85, 160 96, 200 96 C 240 96, 240 60, 280 60 C 320 60, 320 45, 360 45 C 400 45, 400 24, 440 24 L 440 150 L 40 150 Z"
    }
  };

  const METRIC_DATASETS = Object.fromEntries(
    Object.entries(METRIC_CONFIGS).map(([key, config]) => {
      const data = config.series.map((item, idx) => ({
        ...item,
        month: trailingMonths[idx].short,
        fullMonth: trailingMonths[idx].full,
        year: trailingMonths[idx].year,
        isCurrent: trailingMonths[idx].isCurrent,
        label: trailingMonths[idx].label
      }));

      // Find peak data point dynamically
      const peakItem = data.reduce((max, cur) => cur.raw > max.raw ? cur : max, data[0]);

      return [
        key,
        {
          label: config.label,
          unit: config.unit,
          peak: `${config.peakPrefix} ${peakItem.count} in ${peakItem.month}`,
          data,
          curve: config.curve,
          area: config.area
        }
      ];
    })
  );

  const activeDataset = METRIC_DATASETS[activeMetric] || METRIC_DATASETS.rsvps;
  const displayedIndex = hoveredMonthIndex !== null ? hoveredMonthIndex : selectedMonthIndex;
  const displayedDataPoint = activeDataset.data[displayedIndex] || activeDataset.data[activeDataset.data.length - 1];

  // Load events and registered users from backend
  useEffect(() => {
    const loadAdminData = async () => {
      setIsLoading(true);
      try {
        const [eventsRes, usersRes] = await Promise.allSettled([
          eventService.fetchAll({ limit: 50 }),
          adminService.fetchUsers()
        ]);

        if (eventsRes.status === 'fulfilled' && eventsRes.value?.data) {
          setEvents(eventsRes.value.data);
        }

        if (usersRes.status === 'fulfilled' && usersRes.value?.data) {
          setUsersList(usersRes.value.data);
        } else if (usersRes.status === 'rejected') {
          console.warn('Could not fetch registered users:', usersRes.reason);
        }
      } catch (err) {
        console.error('Failed to load admin data:', err);
      } finally {
        setIsLoading(false);
      }
    };
    loadAdminData();
  }, []);

  const handleToggleFeature = async (eventId) => {
    const targetEvent = events.find(e => (e._id || e.id) === eventId);
    if (!targetEvent) return;
    const updated = !targetEvent.isFeatured;

    // Optimistic UI update
    setEvents(prev => prev.map(e => (e._id || e.id) === eventId ? { ...e, isFeatured: updated } : e));

    try {
      await eventService.update(eventId, { isFeatured: updated });
      success(`Event feature status set to ${updated ? 'FEATURED' : 'STANDARD'}`);
    } catch (err) {
      // Revert on error
      setEvents(prev => prev.map(e => (e._id || e.id) === eventId ? { ...e, isFeatured: !updated } : e));
      toastError(err.message || 'Failed to update featured status');
    }
  };

  const handleUpdateStatus = async (eventId, newStatus) => {
    const targetEvent = events.find(e => (e._id || e.id) === eventId);
    if (!targetEvent) return;
    const previousStatus = targetEvent.status;

    // Optimistic UI update
    setEvents(prev => prev.map(e => (e._id || e.id) === eventId ? { ...e, status: newStatus } : e));

    try {
      try {
        await adminService.updateEventStatus(eventId, { status: newStatus });
      } catch (adminErr) {
        console.warn('adminService.updateEventStatus fallback to eventService.update:', adminErr);
        await eventService.update(eventId, { status: newStatus });
      }
      success(newStatus === 'SUSPENDED' ? 'Event successfully SUSPENDED' : `Event status updated to ${newStatus}`);
    } catch (err) {
      // Revert on error
      setEvents(prev => prev.map(e => (e._id || e.id) === eventId ? { ...e, status: previousStatus } : e));
      toastError(err.message || 'Failed to update event status');
    }
  };

  const handleToggleUserStatus = async (userId) => {
    const targetUser = usersList.find(u => (u._id || u.id) === userId);
    if (!targetUser) return;
    const currentStatus = targetUser.status || (targetUser.isSuspended ? 'SUSPENDED' : 'ACTIVE');
    const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';

    // Optimistic UI update
    setUsersList(prev => prev.map(u => {
      if ((u._id || u.id) === userId) {
        return { ...u, status: nextStatus, isSuspended: nextStatus === 'SUSPENDED' };
      }
      return u;
    }));

    try {
      await adminService.updateUserStatus(userId, { status: nextStatus });
      if (nextStatus === 'SUSPENDED') {
        info(`User account has been SUSPENDED.`);
      } else {
        success(`User account has been reactivated to ACTIVE.`);
      }
    } catch (err) {
      // Revert on error
      setUsersList(prev => prev.map(u => {
        if ((u._id || u.id) === userId) {
          return { ...u, status: currentStatus, isSuspended: currentStatus === 'SUSPENDED' };
        }
        return u;
      }));
      toastError(err.message || 'Failed to update user status');
    }
  };

  return (
    <div style={{ backgroundColor: 'var(--color-bg-app)', minHeight: 'calc(100vh - 64px)', paddingBottom: '60px' }}>
      {/* Top Banner Header */}
      <div
        style={{
          backgroundColor: 'var(--color-bg-surface)',
          borderBottom: '1px solid var(--color-border-subtle)',
          padding: '28px 0'
        }}
      >
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(253, 118, 26, 0.1)', color: 'var(--color-secondary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', marginBottom: '10px' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--color-secondary)' }} />
                Platform Command Center
              </div>
              <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', margin: 0, letterSpacing: '-0.02em' }}>
                Admin & Moderation Hub
              </h1>
              <p style={{ color: 'var(--color-text-secondary)', fontSize: '14px', marginTop: '4px' }}>
                Manage local event listings, moderate user activity, and monitor neighborhood growth metrics.
              </p>
            </div>

            {/* Quick Actions */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/discover')}
                style={{ borderRadius: 'var(--radius-full)' }}
              >
                🗺️ Public View
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => navigate('/create-event')}
                style={{ borderRadius: 'var(--radius-full)', fontWeight: 700 }}
              >
                + New Event
              </Button>
            </div>
          </div>

          {/* Navigation Sub-Tabs */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '24px', backgroundColor: 'var(--color-bg-subtle)', padding: '4px', borderRadius: 'var(--radius-full)', width: 'fit-content' }}>
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeTab === 'overview' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'overview' ? '#FFFFFF' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              📊 Analytics Overview
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('events')}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeTab === 'events' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'events' ? '#FFFFFF' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              🗓️ Event Moderation ({events.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('users')}
              style={{
                padding: '8px 20px',
                borderRadius: 'var(--radius-full)',
                fontSize: '13px',
                fontWeight: 700,
                backgroundColor: activeTab === 'users' ? 'var(--color-primary)' : 'transparent',
                color: activeTab === 'users' ? '#FFFFFF' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)'
              }}
            >
              👥 User Management ({usersList.length})
            </button>
          </div>
        </div>
      </div>

      {/* Main Panel Content */}
      <div className="container" style={{ marginTop: '28px' }}>
        {/* VIEW 1: OVERVIEW & ANALYTICS */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* 4 Metric Bento Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <Card variant="default" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Total Users
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>+14.2% ↑</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '4px' }}>
                  12,840
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Registered local explorers</span>
              </Card>

              <Card variant="default" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Active Events
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>+8.6% ↑</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)', marginTop: '4px' }}>
                  {events.length || 428}
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Live on discovery radar</span>
              </Card>

              <Card variant="default" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Monthly RSVPs
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>+22.4% ↑</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-secondary)', marginTop: '4px' }}>
                  34,120
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Confirmed admissions</span>
              </Card>

              <Card variant="default" padding="md">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>
                    Active Neighborhoods
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--color-primary)', fontWeight: 700 }}>100% Online</span>
                </div>
                <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-text-main)', marginTop: '4px' }}>
                  36
                </div>
                <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>Mumbai, Pune & Bengaluru zones</span>
              </Card>
            </div>

            {/* Visual Charts & Distribution */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {/* Growth Activity Interactive SVG Graph & Bar Chart */}
              <Card variant="default" padding="lg">
                {/* Header with Metric & View Switchers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text-main)' }}>
                        📈 Community Engagement Velocity
                      </h3>
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        backgroundColor: 'rgba(253, 118, 26, 0.1)',
                        color: 'var(--color-secondary)',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        {activeDataset.peak}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: '2px', display: 'block' }}>
                      {activeDataset.label} across last 6 months ({startMonthInfo.short} – {currentMonthInfo.short} {currentMonthInfo.year})
                    </span>
                  </div>

                  {/* Controls: Metric Switcher & Chart Type */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    {/* Metric Selector */}
                    <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-subtle)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                      {[
                        { id: 'rsvps', label: '🎟️ RSVPs' },
                        { id: 'visitors', label: '👥 Visits' },
                        { id: 'events', label: '➕ Events' }
                      ].map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => { setActiveMetric(m.id); setHoveredMonthIndex(null); }}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-sm)',
                            border: 'none',
                            cursor: 'pointer',
                            backgroundColor: activeMetric === m.id ? 'var(--color-primary)' : 'transparent',
                            color: activeMetric === m.id ? '#FFFFFF' : 'var(--color-text-secondary)',
                            transition: 'all var(--transition-fast)'
                          }}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {/* Chart View Mode (Curve vs Bars) */}
                    <div style={{ display: 'flex', backgroundColor: 'var(--color-bg-subtle)', padding: '2px', borderRadius: 'var(--radius-md)', border: '1px solid var(--color-border-subtle)' }}>
                      <button
                        type="button"
                        onClick={() => setChartMode('curve')}
                        title="Area Curve View"
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: chartMode === 'curve' ? 'var(--color-bg-surface)' : 'transparent',
                          color: chartMode === 'curve' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          boxShadow: chartMode === 'curve' ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        📈 Curve
                      </button>
                      <button
                        type="button"
                        onClick={() => setChartMode('bars')}
                        title="Column Bar View"
                        style={{
                          padding: '4px 8px',
                          fontSize: '12px',
                          borderRadius: 'var(--radius-sm)',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor: chartMode === 'bars' ? 'var(--color-bg-surface)' : 'transparent',
                          color: chartMode === 'bars' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          boxShadow: chartMode === 'bars' ? 'var(--shadow-sm)' : 'none'
                        }}
                      >
                        📊 Bars
                      </button>
                    </div>
                  </div>
                </div>

                {/* Interactive Dynamic KPI Preview Card - Stable 2-Tier Layout */}
                <div style={{
                  padding: '10px 14px',
                  borderRadius: 'var(--radius-lg)',
                  backgroundColor: 'var(--color-bg-subtle)',
                  border: '1px solid var(--color-border-subtle)',
                  marginBottom: '14px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  boxSizing: 'border-box'
                }}>
                  {/* Tier 1: Main Metric, Growth & Live Status */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: 'var(--color-text-main)' }}>
                        📍 {displayedDataPoint.month} {displayedDataPoint.year}:
                      </span>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: 'var(--color-primary)' }}>
                        {displayedDataPoint.count} {activeDataset.unit}
                      </span>
                      <span style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: 'var(--radius-sm)',
                        backgroundColor: displayedDataPoint.growth.startsWith('+') ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                        color: displayedDataPoint.growth.startsWith('+') ? 'var(--color-success)' : 'var(--color-error)'
                      }}>
                        {displayedDataPoint.growth} MoM
                      </span>
                    </div>

                    {/* Status Badge: Live vs Recorded */}
                    <div>
                      {displayedDataPoint.isCurrent ? (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 800,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          backgroundColor: 'rgba(15, 118, 110, 0.12)',
                          color: 'var(--color-primary)',
                          border: '1px solid rgba(15, 118, 110, 0.25)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: 'var(--color-primary)' }} />
                          Live Month
                        </span>
                      ) : (
                        <span style={{
                          fontSize: '10px',
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 'var(--radius-full)',
                          color: 'var(--color-text-muted)',
                          backgroundColor: 'rgba(0,0,0,0.03)',
                          display: 'inline-flex',
                          alignItems: 'center'
                        }}>
                          Historical
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tier 2: Event Volume & Top Category */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '11px',
                    color: 'var(--color-text-muted)',
                    borderTop: '1px solid var(--color-border-subtle)',
                    paddingTop: '6px'
                  }}>
                    <span>🗓️ <strong>{displayedDataPoint.events}</strong> Events Published</span>
                    <span>🏆 Top: <strong>{displayedDataPoint.topCat}</strong></span>
                  </div>
                </div>

                {/* Chart Area Viewport */}
                {chartMode === 'curve' ? (
                  <div
                    style={{
                      position: 'relative',
                      width: '100%',
                      height: '180px',
                      backgroundColor: 'rgba(15, 118, 110, 0.02)',
                      borderRadius: 'var(--radius-md)',
                      padding: '10px 0',
                      cursor: 'crosshair'
                    }}
                  >
                    <svg
                      viewBox="0 0 480 160"
                      style={{ width: '100%', height: '100%', overflow: 'visible' }}
                      preserveAspectRatio="none"
                    >
                      <defs>
                        <linearGradient id="activeEngagementGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0F766E" stopOpacity="0.45" />
                          <stop offset="60%" stopColor="#0F766E" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#0F766E" stopOpacity="0.0" />
                        </linearGradient>
                        <linearGradient id="activeLineStrokeGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#14B8A6" />
                          <stop offset="50%" stopColor="#0F766E" />
                          <stop offset="100%" stopColor="#FD761A" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Reference Grid Lines */}
                      <line x1="30" y1="30" x2="450" y2="30" stroke="var(--color-border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="30" y1="75" x2="450" y2="75" stroke="var(--color-border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="30" y1="120" x2="450" y2="120" stroke="var(--color-border-subtle)" strokeDasharray="4 4" strokeWidth="1" />
                      <line x1="30" y1="150" x2="450" y2="150" stroke="var(--color-border-subtle)" strokeWidth="1" />

                      {/* Active Hover Crosshair Line */}
                      <line
                        x1={displayedDataPoint.cx}
                        y1="10"
                        x2={displayedDataPoint.cx}
                        y2="150"
                        stroke="var(--color-secondary)"
                        strokeWidth="1.5"
                        strokeDasharray="3 3"
                        opacity="0.8"
                      />

                      {/* Area Gradient Fill */}
                      <path
                        d={activeDataset.area}
                        fill="url(#activeEngagementGradient)"
                        style={{ transition: 'd 0.3s ease' }}
                      />

                      {/* Smooth Metric Line */}
                      <path
                        d={activeDataset.curve}
                        fill="none"
                        stroke="url(#activeLineStrokeGradient)"
                        strokeWidth="3.5"
                        strokeLinecap="round"
                        style={{ transition: 'd 0.3s ease' }}
                      />

                      {/* Interactive Data Node Points */}
                      {activeDataset.data.map((pt, idx) => {
                        const isFocused = displayedIndex === idx;
                        return (
                          <g
                            key={`${pt.month}-${pt.year}`}
                            style={{ cursor: 'pointer' }}
                            onMouseEnter={() => setHoveredMonthIndex(idx)}
                            onMouseLeave={() => setHoveredMonthIndex(null)}
                            onClick={() => setSelectedMonthIndex(idx)}
                          >
                            {/* Larger Invisible Target for easy hover/touch */}
                            <circle cx={pt.cx} cy={pt.cy} r="20" fill="transparent" />

                            {/* Outer Glow Ring on Focused Node */}
                            {isFocused && (
                              <circle
                                cx={pt.cx}
                                cy={pt.cy}
                                r="12"
                                fill="none"
                                stroke="#FD761A"
                                strokeWidth="2.5"
                                opacity="0.6"
                              >
                                <animate attributeName="r" values="8;14;8" dur="1.8s" repeatCount="indefinite" />
                                <animate attributeName="opacity" values="0.8;0.2;0.8" dur="1.8s" repeatCount="indefinite" />
                              </circle>
                            )}

                            {/* Node Dot */}
                            <circle
                              cx={pt.cx}
                              cy={pt.cy}
                              r={isFocused ? "7" : "4.5"}
                              fill={isFocused ? "#FD761A" : "#0F766E"}
                              stroke="#FFFFFF"
                              strokeWidth="2.5"
                              style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))', transition: 'all 0.15s ease' }}
                            />
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                ) : (
                  /* Interactive Column Bar View */
                  <div style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    height: '180px',
                    padding: '20px 10px 10px 10px',
                    backgroundColor: 'rgba(15, 118, 110, 0.02)',
                    borderRadius: 'var(--radius-md)',
                    borderBottom: '1px solid var(--color-border-subtle)',
                    gap: '12px'
                  }}>
                    {activeDataset.data.map((bar, idx) => {
                      const isFocused = displayedIndex === idx;
                      return (
                        <div
                          key={`${bar.month}-${bar.year}`}
                          onMouseEnter={() => setHoveredMonthIndex(idx)}
                          onMouseLeave={() => setHoveredMonthIndex(null)}
                          onClick={() => setSelectedMonthIndex(idx)}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '8px',
                            flex: 1,
                            height: '100%',
                            justifyContent: 'flex-end',
                            cursor: 'pointer'
                          }}
                        >
                          <span style={{
                            fontSize: '11px',
                            fontWeight: 800,
                            color: isFocused ? 'var(--color-secondary)' : 'var(--color-primary)',
                            transform: isFocused ? 'scale(1.1)' : 'none',
                            transition: 'all 0.15s ease'
                          }}>
                            {bar.count}
                          </span>
                          <div
                            style={{
                              width: '100%',
                              maxWidth: '44px',
                              height: bar.height,
                              borderRadius: '8px 8px 0 0',
                              background: isFocused
                                ? 'linear-gradient(180deg, #FD761A 0%, #EA580C 100%)'
                                : 'linear-gradient(180deg, #14B8A6 0%, #0F766E 100%)',
                              boxShadow: isFocused ? '0 4px 12px rgba(253, 118, 26, 0.4)' : 'none',
                              transform: isFocused ? 'translateY(-4px)' : 'none',
                              transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}
                          />
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Interactive X-Axis Month Selectors */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', padding: '0 4px', gap: '6px' }}>
                  {activeDataset.data.map((item, idx) => {
                    const isFocused = displayedIndex === idx;
                    return (
                      <button
                        key={`${item.month}-${item.year}`}
                        type="button"
                        onMouseEnter={() => setHoveredMonthIndex(idx)}
                        onMouseLeave={() => setHoveredMonthIndex(null)}
                        onClick={() => setSelectedMonthIndex(idx)}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '2px',
                          flex: 1,
                          height: '52px',
                          padding: '4px 2px',
                          borderRadius: 'var(--radius-md)',
                          border: isFocused ? '1.5px solid var(--color-primary)' : '1.5px solid transparent',
                          backgroundColor: isFocused ? 'var(--color-primary-light)' : 'transparent',
                          cursor: 'pointer',
                          position: 'relative',
                          boxSizing: 'border-box',
                          transition: 'all var(--transition-fast)'
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 800, color: isFocused ? 'var(--color-primary)' : 'var(--color-text-main)', lineHeight: 1.2 }}>
                          {item.count}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: isFocused ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '3px',
                          lineHeight: 1.2
                        }}>
                          {item.month}
                          {item.isCurrent && (
                            <span
                              style={{
                                width: '5px',
                                height: '5px',
                                borderRadius: '50%',
                                backgroundColor: 'var(--color-secondary)',
                                display: 'inline-block'
                              }}
                              title="Current Live Month"
                            />
                          )}
                        </span>
                        <span style={{
                          fontSize: '9px',
                          fontWeight: 800,
                          color: 'var(--color-secondary)',
                          lineHeight: 1,
                          minHeight: '10px',
                          visibility: item.isCurrent ? 'visible' : 'hidden'
                        }}>
                          Live
                        </span>
                      </button>
                    );
                  })}
                </div>
              </Card>

              {/* Category Breakdown Progress */}
              <Card variant="default" padding="lg">
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '16px', color: 'var(--color-text-main)' }}>
                  🎯 Popular Gathering Categories
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {[
                    { name: 'Live Music & Gigs', percent: 38, color: '#0F766E' },
                    { name: 'Food & Drink Pop-ups', percent: 24, color: '#FD761A' },
                    { name: 'Arts & Creative Culture', percent: 18, color: '#14B8A6' },
                    { name: 'Markets & Fleas', percent: 12, color: '#8B5CF6' },
                    { name: 'Sports & Community Runs', percent: 8, color: '#10B981' }
                  ].map((cat) => (
                    <div key={cat.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 600, marginBottom: '4px' }}>
                        <span>{cat.name}</span>
                        <span style={{ color: 'var(--color-text-muted)' }}>{cat.percent}%</span>
                      </div>
                      <div style={{ width: '100%', height: '8px', borderRadius: 'var(--radius-full)', backgroundColor: 'var(--color-bg-subtle)', overflow: 'hidden' }}>
                        <div style={{ width: `${cat.percent}%`, height: '100%', backgroundColor: cat.color, borderRadius: 'var(--radius-full)' }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* VIEW 2: EVENT MODERATION TABLE */}
        {activeTab === 'events' && (
          <Card variant="default" padding="none" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-border-subtle)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
              <input
                type="text"
                placeholder="Search events by title, organizer, or venue..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid var(--color-border-subtle)',
                  backgroundColor: 'var(--color-bg-app)',
                  fontSize: '13px',
                  minWidth: '280px',
                  outline: 'none'
                }}
              />

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {['ALL', 'ACTIVE', 'FEATURED', 'SUSPENDED', 'CANCELLED'].map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSelectedStatusFilter(st)}
                    style={{
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontSize: '11px',
                      fontWeight: 700,
                      backgroundColor: selectedStatusFilter === st ? 'var(--color-primary)' : 'var(--color-bg-subtle)',
                      color: selectedStatusFilter === st ? '#FFFFFF' : 'var(--color-text-muted)',
                      border: 'none',
                      cursor: 'pointer'
                    }}
                  >
                    {st === 'SUSPENDED' ? '⚠️ SUSPENDED' : st}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 20px' }}>Event & Category</th>
                    <th style={{ padding: '12px 16px' }}>Host / Organizer</th>
                    <th style={{ padding: '12px 16px' }}>Date & Location</th>
                    <th style={{ padding: '12px 16px' }}>Price</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {events
                    .filter(e => {
                      if (selectedStatusFilter === 'FEATURED') return e.isFeatured;
                      if (selectedStatusFilter !== 'ALL') return e.status === selectedStatusFilter;
                      return true;
                    })
                    .filter(e => e.title.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((ev) => {
                      const eventId = ev._id || ev.id;
                      const isSuspended = ev.status === 'SUSPENDED';
                      const isCancelled = ev.status === 'CANCELLED';

                      return (
                        <tr key={eventId} style={{ borderBottom: '1px solid var(--color-border-subtle)', transition: 'background-color 0.15s', backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.03)' : 'transparent' }}>
                          <td style={{ padding: '12px 20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <img
                                src={ev.image || 'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?auto=format&fit=crop&w=120&q=80'}
                                alt={ev.title}
                                style={{ width: '40px', height: '40px', borderRadius: 'var(--radius-md)', objectFit: 'cover', opacity: isSuspended ? 0.6 : 1 }}
                              />
                              <div>
                                <div style={{ fontWeight: 700, color: 'var(--color-text-main)', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {ev.title}
                                </div>
                                <span style={{ fontSize: '11px', color: 'var(--color-primary)', fontWeight: 600 }}>
                                  {ev.category || 'General'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-text-secondary)', fontWeight: 600 }}>
                            {ev.organizer?.name || 'Local Curator'}
                          </td>
                          <td style={{ padding: '12px 16px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                            <div>{new Date(ev.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</div>
                            <div>{ev.location?.city || 'Mumbai'}</div>
                          </td>
                          <td style={{ padding: '12px 16px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {ev.price === 0 || !ev.price ? 'Free' : `₹${ev.price}`}
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            {isSuspended ? (
                              <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(239, 68, 68, 0.12)', color: 'var(--color-error)', fontSize: '11px', fontWeight: 700 }}>
                                ⚠️ Suspended
                              </span>
                            ) : isCancelled ? (
                              <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(239, 68, 68, 0.08)', color: 'var(--color-error)', fontSize: '11px', fontWeight: 700 }}>
                                🚫 Cancelled
                              </span>
                            ) : ev.isFeatured ? (
                              <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(253, 118, 26, 0.1)', color: 'var(--color-secondary)', fontSize: '11px', fontWeight: 700 }}>
                                ⭐ Featured
                              </span>
                            ) : (
                              <span style={{ padding: '3px 8px', borderRadius: 'var(--radius-full)', backgroundColor: 'rgba(15, 118, 110, 0.1)', color: 'var(--color-primary)', fontSize: '11px', fontWeight: 700 }}>
                                Active
                              </span>
                            )}
                          </td>
                          <td style={{ padding: '12px 20px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                type="button"
                                onClick={() => handleToggleFeature(eventId)}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: ev.isFeatured ? 'var(--color-secondary)' : 'var(--color-bg-subtle)',
                                  color: ev.isFeatured ? '#FFFFFF' : 'var(--color-text-secondary)',
                                  border: '1px solid var(--color-border-subtle)',
                                  fontSize: '11px',
                                  fontWeight: 600,
                                  cursor: 'pointer'
                                }}
                              >
                                {ev.isFeatured ? '★ Unfeature' : '☆ Feature'}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleUpdateStatus(eventId, isSuspended || isCancelled ? 'ACTIVE' : 'SUSPENDED')}
                                style={{
                                  padding: '4px 8px',
                                  borderRadius: 'var(--radius-md)',
                                  backgroundColor: isSuspended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                  color: isSuspended ? 'var(--color-success)' : 'var(--color-error)',
                                  border: `1px solid ${isSuspended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                              >
                                {isSuspended || isCancelled ? '✓ Activate' : '⚠️ Suspend'}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </Card>
        )}

        {/* VIEW 3: USER MANAGEMENT TABLE */}
        {activeTab === 'users' && (
          <Card variant="default" padding="none" style={{ overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--color-bg-subtle)', borderBottom: '1px solid var(--color-border-subtle)', color: 'var(--color-text-muted)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                    <th style={{ padding: '12px 20px' }}>User</th>
                    <th style={{ padding: '12px 16px' }}>Email</th>
                    <th style={{ padding: '12px 16px' }}>Role</th>
                    <th style={{ padding: '12px 16px' }}>City</th>
                    <th style={{ padding: '12px 16px' }}>Hosted Count</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                    <th style={{ padding: '12px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersList.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                        No registered users found in the database.
                      </td>
                    </tr>
                  ) : (
                    usersList.map((usr) => {
                      const userId = usr._id || usr.id;
                      const isSuspended = usr.status === 'SUSPENDED' || usr.isSuspended;
                      const userStatus = isSuspended ? 'SUSPENDED' : 'ACTIVE';
                      const userRole = usr.role || 'Member';
                      const userName = usr.name || (usr.email ? usr.email.split('@')[0] : 'Community User');
                      const userCity = usr.city || usr.location?.city || 'Local Explorer';
                      const eventsCount = usr.eventsCount ?? usr.hostedCount ?? (Array.isArray(usr.createdEvents) ? usr.createdEvents.length : 0);

                      return (
                        <tr
                          key={userId}
                          style={{
                            borderBottom: '1px solid var(--color-border-subtle)',
                            backgroundColor: isSuspended ? 'rgba(239, 68, 68, 0.03)' : 'transparent',
                            transition: 'background-color 0.15s'
                          }}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--color-text-main)', fontSize: '13.5px' }}>
                                {userName}
                              </span>
                              <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                ID: {String(userId).slice(-6)}
                              </span>
                            </div>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                            {usr.email}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: userRole === 'ADMIN' ? 'rgba(253, 118, 26, 0.12)' : userRole === 'Host' || userRole === 'Curator' ? 'rgba(15, 118, 110, 0.1)' : 'rgba(0,0,0,0.06)',
                              color: userRole === 'ADMIN' ? 'var(--color-secondary)' : userRole === 'Host' || userRole === 'Curator' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                              fontSize: '11px',
                              fontWeight: 700
                            }}>
                              {userRole}
                            </span>
                          </td>
                          <td style={{ padding: '14px 16px', color: 'var(--color-text-secondary)' }}>
                            {userCity}
                          </td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--color-text-main)' }}>
                            {eventsCount} {eventsCount === 1 ? 'event' : 'events'}
                          </td>
                          <td style={{ padding: '14px 16px' }}>
                            <span style={{
                              padding: '3px 10px',
                              borderRadius: 'var(--radius-full)',
                              backgroundColor: !isSuspended ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                              color: !isSuspended ? 'var(--color-success)' : 'var(--color-error)',
                              fontSize: '11px',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}>
                              <span style={{ width: '5px', height: '5px', borderRadius: '50%', backgroundColor: !isSuspended ? 'var(--color-success)' : 'var(--color-error)' }} />
                              {userStatus}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <button
                              type="button"
                              onClick={() => handleToggleUserStatus(userId)}
                              style={{
                                padding: '5px 12px',
                                borderRadius: 'var(--radius-md)',
                                backgroundColor: isSuspended ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                                color: isSuspended ? 'var(--color-success)' : 'var(--color-error)',
                                border: `1px solid ${isSuspended ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                                fontSize: '11px',
                                fontWeight: 700,
                                cursor: 'pointer',
                                transition: 'all var(--transition-fast)'
                              }}
                            >
                              {isSuspended ? '✓ Reactivate' : '⚠️ Suspend'}
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};
