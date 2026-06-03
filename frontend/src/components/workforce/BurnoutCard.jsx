/**
 * BurnoutCard.jsx
 * Displays employee burnout risk with animated gauge and reason list.
 * 
 * Placement: src/components/workforce/BurnoutCard.jsx
 */

import React from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip,
  LinearProgress, List, ListItem, ListItemIcon,
  Skeleton, Avatar, Tooltip, Grid,
} from '@mui/material';
import {
  LocalFireDepartment as FireIcon,
  FiberManualRecord as DotIcon,
  InfoOutlined as InfoIcon,
} from '@mui/icons-material';

// ── Color Map ────────────────────────────────────────────────────────────────
const LEVEL_CONFIG = {
  LOW:         { color: '#22c55e', bg: '#f0fdf4', label: 'Low Risk',    icon: '🟢' },
  MEDIUM:      { color: '#f97316', bg: '#fff7ed', label: 'Medium Risk', icon: '🟠' },
  HIGH:        { color: '#ef4444', bg: '#fef2f2', label: 'High Risk',   icon: '🔴' },
  UNAVAILABLE: { color: '#9ca3af', bg: '#f9fafb', label: 'Unavailable', icon: '⚪' },
};

export default function BurnoutCard({ data, loading }) {

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" height={12} sx={{ my: 2, borderRadius: 6 }} />
          {[1, 2, 3].map(i => (
            <Skeleton key={i} variant="text" width={`${70 + i * 5}%`} sx={{ mt: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No burnout data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const level = data.level || 'UNAVAILABLE';
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.UNAVAILABLE;
  const score = data.burnoutRisk ?? 0;

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        border: `1px solid ${config.color}25`,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
      }}
    >
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: config.bg, width: 44, height: 44 }}>
            <FireIcon sx={{ color: config.color, fontSize: 24 }} />
          </Avatar>
        }
        title={
          <Typography variant="h6" fontWeight={700}>
            Burnout Risk Analysis
          </Typography>
        }
        subheader={`Employee #${data.employeeId}`}
        action={
          <Chip
            label={config.label}
            size="small"
            sx={{
              bgcolor: config.bg,
              color: config.color,
              fontWeight: 700,
              border: `1px solid ${config.color}`,
              mt: 1,
            }}
          />
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>

        {/* ── Score Display ──────────────────────────────────────────────── */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Burnout Risk Score
            </Typography>
            <Typography variant="h5" fontWeight={800} color={config.color}>
              {score}%
            </Typography>
          </Box>

          <LinearProgress
            variant="determinate"
            value={score}
            sx={{
              height: 10,
              borderRadius: 5,
              bgcolor: `${config.color}20`,
              '& .MuiLinearProgress-bar': {
                borderRadius: 5,
                bgcolor: config.color,
              },
            }}
          />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.disabled">
              0 — Safe
            </Typography>
            <Typography variant="caption" color="text.disabled">
              100 — Critical
            </Typography>
          </Box>
        </Box>

        {/* ── Risk Reasons ───────────────────────────────────────────────── */}
        {data.reasons?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography
              variant="subtitle2"
              fontWeight={700}
              color="text.secondary"
              sx={{ mb: 1 }}
            >
              Risk Indicators
            </Typography>

            <List dense disablePadding>
              {data.reasons.map((reason, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <DotIcon sx={{ fontSize: 10, color: config.color }} />
                  </ListItemIcon>

                  <Typography variant="body2" color="text.secondary">
                    {reason}
                  </Typography>
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* ── Factor Breakdown ───────────────────────────────────────────── */}
        {data.factorScores && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled" fontWeight={600}>
              FACTOR BREAKDOWN
            </Typography>

            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              {Object.entries(data.factorScores).map(([key, val]) => (
                <Grid item xs={6} key={key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{ textTransform: 'capitalize' }}
                    >
                      {key.replace(/_/g, ' ')}
                    </Typography>

                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color={
                        val >= 70
                          ? 'error.main'
                          : val >= 40
                          ? 'warning.main'
                          : 'success.main'
                      }
                    >
                      {val}
                    </Typography>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}

      </CardContent>
    </Card>
  );
}