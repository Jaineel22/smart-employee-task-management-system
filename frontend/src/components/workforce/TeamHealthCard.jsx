/**
 * TeamHealthCard.jsx
 * Displays team health score, dimension breakdown, and employee risk lists.
 * 
 * Placement: src/components/workforce/TeamHealthCard.jsx
 */

import React from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip, Grid,
  LinearProgress, List, ListItem, ListItemText, ListItemAvatar,
  Avatar, Divider, Skeleton, Alert,
} from '@mui/material';
import {
  Groups       as TeamIcon,
  Star         as StarIcon,
  Warning      as WarnIcon,
  ArrowDropDown as DownIcon,
} from '@mui/icons-material';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const CATEGORY_CONFIG = {
  'Excellent':       { color: '#22c55e', bg: '#f0fdf4' },
  'Good':            { color: '#3b82f6', bg: '#eff6ff' },
  'Average':         { color: '#f97316', bg: '#fff7ed' },
  'Needs Attention': { color: '#ef4444', bg: '#fef2f2' },
  'UNAVAILABLE':     { color: '#9ca3af', bg: '#f9fafb' },
  'No Data':         { color: '#9ca3af', bg: '#f9fafb' },
};

export default function TeamHealthCard({ data, loading }) {

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="50%" height={36} />
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {[1,2,3,4,5].map(i => (
              <Grid item xs={12} sm={6} md={2.4} key={i}>
                <Skeleton variant="rectangular" height={80} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Alert severity="info">
            Team health data will appear after employees submit their metrics.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const category = data.category || 'No Data';
  const config   = CATEGORY_CONFIG[category] || CATEGORY_CONFIG['No Data'];
  const health   = data.teamHealth ?? 0;

  // ── Radar Data ─────────────────────────────────────────────────────────────
  const radarData = [
    { subject: 'Attendance',   value: data.attendanceScore   ?? 0 },
    { subject: 'Productivity', value: data.productivityScore ?? 0 },
    { subject: 'Completion',   value: data.completionScore   ?? 0 },
    { subject: 'Engagement',   value: data.engagementScore   ?? 0 },
    { subject: 'Utilization',  value: data.utilizationScore  ?? 0 },
  ];

  // ── Score Metric Tiles ──────────────────────────────────────────────────────
  const metrics = [
    { label: 'Attendance',   value: data.attendanceScore   ?? 0, color: '#3b82f6' },
    { label: 'Productivity', value: data.productivityScore ?? 0, color: '#22c55e' },
    { label: 'Completion',   value: data.completionScore   ?? 0, color: '#8b5cf6' },
    { label: 'Engagement',   value: data.engagementScore   ?? 0, color: '#f97316' },
    { label: 'Avg Burnout',  value: data.averageBurnout    ?? 0, color: '#ef4444', invert: true },
  ];

  return (
    <Card elevation={2} sx={{ borderRadius: 3, overflow: 'visible' }}>
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: config.bg, width: 44, height: 44 }}>
            <TeamIcon sx={{ color: config.color, fontSize: 26 }} />
          </Avatar>
        }
        title={<Typography variant="h6" fontWeight={700}>Team Health Overview</Typography>}
        subheader={`${data.teamSize ?? 0} members • Manager #${data.managerId}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
            <Chip
              label={category}
              sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700, border: `1px solid ${config.color}` }}
            />
            <Typography variant="h4" fontWeight={900} color={config.color} sx={{ mr: 1 }}>
              {health}
            </Typography>
          </Box>
        }
      />

      <CardContent sx={{ pt: 0 }}>

        {/* ── Overall Progress ───────────────────────────────────────────── */}
        <Box sx={{ mb: 3 }}>
          <LinearProgress
            variant="determinate"
            value={health}
            sx={{
              height: 12,
              borderRadius: 6,
              bgcolor: `${config.color}15`,
              '& .MuiLinearProgress-bar': { borderRadius: 6, bgcolor: config.color },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.disabled">0 — Needs Attention</Typography>
            <Typography variant="caption" color="text.disabled">100 — Excellent</Typography>
          </Box>
        </Box>

        {/* ── Metric Tiles ───────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {metrics.map(({ label, value, color, invert }) => (
            <Grid item xs={6} sm={4} md={2.4} key={label}>
              <Box
                sx={{
                  p: 1.5, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  textAlign: 'center',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <Typography variant="h5" fontWeight={800}
                  color={invert
                    ? (value >= 70 ? 'error.main' : value >= 40 ? 'warning.main' : 'success.main')
                    : color
                  }
                >
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary">{label}</Typography>
                <LinearProgress
                  variant="determinate"
                  value={invert ? value : value}
                  sx={{
                    mt: 0.5, height: 4, borderRadius: 2,
                    bgcolor: `${color}20`,
                    '& .MuiLinearProgress-bar': {
                      bgcolor: invert
                        ? (value >= 70 ? '#ef4444' : value >= 40 ? '#f97316' : '#22c55e')
                        : color,
                    },
                  }}
                />
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* ── Radar Chart ────────────────────────────────────────────────── */}
        {data.teamSize > 0 && (
          <Box sx={{ height: 250, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
              Team Dimension Radar
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="subject" tick={{ fontSize: 12 }} />
                <Radar
                  name="Team"
                  dataKey="value"
                  fill={config.color}
                  fillOpacity={0.25}
                  stroke={config.color}
                  strokeWidth={2}
                />
                <Tooltip formatter={(v) => [`${v}%`, 'Score']} />
              </RadarChart>
            </ResponsiveContainer>
          </Box>
        )}

        {/* ── Insights ───────────────────────────────────────────────────── */}
        {data.insights?.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Divider sx={{ mb: 2 }} />
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
              AI Insights
            </Typography>
            {data.insights.map((ins, i) => (
              <Alert
                key={i}
                severity={
                  ins.toLowerCase().includes('critical') ? 'error'   :
                  ins.toLowerCase().includes('attention') ? 'warning' : 'info'
                }
                sx={{ mb: 1, py: 0 }}
              >
                <Typography variant="body2">{ins}</Typography>
              </Alert>
            ))}
          </Box>
        )}

        {/* ── Top & Bottom Performers ────────────────────────────────────── */}
        {(data.topPerformers?.length > 0 || data.bottomPerformers?.length > 0) && (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                <StarIcon sx={{ fontSize: 16, mr: 0.5, color: '#f59e0b', verticalAlign: 'middle' }} />
                Top Performers
              </Typography>
              <List dense disablePadding>
                {(data.topPerformers || []).map((emp, i) => (
                  <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                    <ListItemAvatar sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 28, height: 28, bgcolor: '#22c55e20', fontSize: 12 }}>
                        {i + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={emp.name || `Employee #${emp.employeeId}`}
                      secondary={`Productivity: ${emp.productivityScore}%`}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Grid>

            {data.highRiskEmployees?.length > 0 && (
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
                  <WarnIcon sx={{ fontSize: 16, mr: 0.5, color: '#ef4444', verticalAlign: 'middle' }} />
                  High Risk Employees
                </Typography>
                <List dense disablePadding>
                  {(data.highRiskEmployees || []).map((emp, i) => (
                    <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar sx={{ width: 28, height: 28, bgcolor: '#ef444420', fontSize: 12 }}>
                          <WarnIcon sx={{ fontSize: 14, color: '#ef4444' }} />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={emp.name || `Employee #${emp.employeeId}`}
                        secondary={`Burnout: ${emp.burnoutRisk}%`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                        secondaryTypographyProps={{ variant: 'caption', color: 'error.main' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Grid>
            )}
          </Grid>
        )}

      </CardContent>
    </Card>
  );
}