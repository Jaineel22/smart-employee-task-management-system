/**
 * WorkforceIntelligencePage.jsx
 * 
 * Main page for AI-4 Workforce Analytics & Productivity Intelligence.
 * Renders different views based on user role:
 *   - MANAGER → Team Health, Team Burnout, Team Attrition, Risk Overview
 *   - EMPLOYEE → Personal Burnout, Attrition, Forecast, Recommendations
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Container, Grid, Typography, Alert, Tabs, Tab,
  Skeleton, Fade, Chip, Divider, Paper,
} from '@mui/material';
import {
  Psychology as PsychologyIcon,
  Insights as InsightsIcon,
  Groups as GroupsIcon,
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext'; // ✅ Use your existing AuthContext
import axios from 'axios';

import BurnoutCard from '../components/workforce/BurnoutCard';
import AttritionCard from '../components/workforce/AttritionCard';
import TeamHealthCard from '../components/workforce/TeamHealthCard';
import GrowthForecastCard from '../components/workforce/GrowthForecastCard';
import RecommendationCard from '../components/workforce/RecommendationCard';

// ── Constants ──────────────────────────────────────────────────────────────────
const API_BASE = 'http://localhost:8080/api/ai';

// ── Tab Panel Helper ───────────────────────────────────────────────────────────
function TabPanel({ children, value, index }) {
  return (
    <Box role="tabpanel" hidden={value !== index} sx={{ py: 3 }}>
      {value === index && <Fade in timeout={400}>{children}</Fade>}
    </Box>
  );
}

// ── Main Page Component ────────────────────────────────────────────────────────
export default function WorkforceIntelligencePage() {
  const { user } = useAuth(); // ✅ Use useAuth instead of useSelector
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN';
  const employeeId = user?.id;

  const [tab, setTab] = useState(0);
  const [burnout, setBurnout] = useState(null);
  const [attrition, setAttrition] = useState(null);
  const [teamHealth, setTeamHealth] = useState(null);
  const [forecast, setForecast] = useState(null);
  const [recommendations, setRecommendations] = useState(null);
  const [loading, setLoading] = useState(true);
  const [aiAvailable, setAiAvailable] = useState(true);
  const [error, setError] = useState(null);

  // ── Fetch All Data ───────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Check AI availability
      try {
        const health = await axios.get(`${API_BASE}/health`, { headers });
        setAiAvailable(health?.data?.status === 'healthy');
      } catch (err) {
        setAiAvailable(false);
      }

      if (isManager && employeeId) {
        // Manager — fetch burnout & attrition for their own metrics
        const [b, a] = await Promise.allSettled([
          axios.get(`${API_BASE}/burnout/${employeeId}?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, { headers }),
          axios.get(`${API_BASE}/attrition/${employeeId}`, { headers }),
        ]);

        if (b.status === 'fulfilled') setBurnout(b.value.data);
        if (a.status === 'fulfilled') setAttrition(a.value.data);

        // Team health mock data (since API might not be ready)
        setTeamHealth({
          teamHealth: 78,
          category: 'Good',
          attendanceScore: 82,
          productivityScore: 75,
          completionScore: 80,
          engagementScore: 76,
          highRiskCount: 1,
        });

      } else if (employeeId) {
        // Employee — fetch all personal analytics
        const [b, a, rec, fc] = await Promise.allSettled([
          axios.get(`${API_BASE}/burnout/${employeeId}?month=${new Date().getMonth() + 1}&year=${new Date().getFullYear()}`, { headers }),
          axios.get(`${API_BASE}/attrition/${employeeId}`, { headers }),
          axios.get(`${API_BASE}/recommendations/${employeeId}`, { headers }),
          axios.get(`${API_BASE}/forecast/${employeeId}`, { headers }),
        ]);

        if (b.status === 'fulfilled') setBurnout(b.value.data);
        if (a.status === 'fulfilled') setAttrition(a.value.data);
        if (rec.status === 'fulfilled') setRecommendations(rec.value.data);
        if (fc.status === 'fulfilled') setForecast(fc.value.data);
      }

    } catch (err) {
      console.error('[WorkforceIntelligence] Data fetch error:', err);
      setError('Failed to load workforce intelligence data. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [employeeId, isManager]);

  useEffect(() => {
    if (employeeId) {
      fetchData();
    }
  }, [fetchData, employeeId]);

  // ── Tabs Config ─────────────────────────────────────────────────────────────
  const managerTabs = [
    { label: 'Team Health', icon: <GroupsIcon fontSize="small" /> },
    { label: 'Risk Overview', icon: <WarningIcon fontSize="small" /> },
    { label: 'My Analytics', icon: <InsightsIcon fontSize="small" /> },
  ];
  const employeeTabs = [
    { label: 'My Wellbeing', icon: <PsychologyIcon fontSize="small" /> },
    { label: 'Growth & Forecast', icon: <TrendingUpIcon fontSize="small" /> },
    { label: 'AI Recommendations', icon: <InsightsIcon fontSize="small" /> },
  ];
  const tabs = isManager ? managerTabs : employeeTabs;

  // ── Loading Skeleton ─────────────────────────────────────────────────────────
  if (loading) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={60} sx={{ mb: 3, borderRadius: 2 }} />
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map(i => (
            <Grid item xs={12} md={6} key={i}>
              <Skeleton variant="rectangular" height={220} sx={{ borderRadius: 2 }} />
            </Grid>
          ))}
        </Grid>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>

      {/* ── Header ────────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          <PsychologyIcon sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={700}>
            Workforce Intelligence
          </Typography>
          <Chip
            label="AI-4 Powered"
            size="small"
            color="primary"
            variant="outlined"
            sx={{ fontWeight: 600 }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {isManager
            ? 'Real-time team health, risk detection, and AI-driven workforce insights'
            : 'Your personal wellbeing analysis, growth forecast, and AI recommendations'}
        </Typography>
      </Box>

      {/* ── AI Unavailable Warning ─────────────────────────────────────────── */}
      {!aiAvailable && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          AI service is currently unavailable. Showing fallback data.
          Core application functionality remains unaffected.
        </Alert>
      )}

      {/* ── Tabs Navigation ───────────────────────────────────────────────── */}
      <Paper sx={{ mb: 2 }} elevation={0} variant="outlined">
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 2 }}
        >
          {tabs.map((t, i) => (
            <Tab
              key={i}
              label={t.label}
              icon={t.icon}
              iconPosition="start"
              sx={{ fontWeight: 600, minHeight: 56 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* ── Manager: Tab 0 — Team Health ──────────────────────────────────── */}
      {isManager && (
        <TabPanel value={tab} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TeamHealthCard data={teamHealth} loading={loading} />
            </Grid>
            {burnout && (
              <Grid item xs={12} md={6}>
                <BurnoutCard data={burnout} loading={loading} />
              </Grid>
            )}
            {attrition && (
              <Grid item xs={12} md={6}>
                <AttritionCard data={attrition} loading={loading} />
              </Grid>
            )}
          </Grid>
        </TabPanel>
      )}

      {/* ── Manager: Tab 1 — Risk Overview ────────────────────────────────── */}
      {isManager && (
        <TabPanel value={tab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <BurnoutCard data={burnout} loading={loading} />
            </Grid>
            <Grid item xs={12} md={6}>
              <AttritionCard data={attrition} loading={loading} />
            </Grid>
            <Grid item xs={12}>
              <GrowthForecastCard data={forecast} loading={loading} />
            </Grid>
          </Grid>
        </TabPanel>
      )}

      {/* ── Manager: Tab 2 / Employee: Tab 0 — Personal / Wellbeing ──────── */}
      <TabPanel value={tab} index={isManager ? 2 : 0}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <BurnoutCard data={burnout} loading={loading} />
          </Grid>
          <Grid item xs={12} md={6}>
            <AttritionCard data={attrition} loading={loading} />
          </Grid>
        </Grid>
      </TabPanel>

      {/* ── Employee: Tab 1 — Growth & Forecast ───────────────────────────── */}
      {!isManager && (
        <TabPanel value={tab} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <GrowthForecastCard data={forecast} loading={loading} />
            </Grid>
          </Grid>
        </TabPanel>
      )}

      {/* ── Employee: Tab 2 / Manager Tab 2 — Recommendations ────────────── */}
      <TabPanel value={tab} index={isManager ? 2 : 2}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <RecommendationCard data={recommendations} loading={loading} />
          </Grid>
        </Grid>
      </TabPanel>

    </Container>
  );
}