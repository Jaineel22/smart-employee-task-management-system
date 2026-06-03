/**
 * AttritionCard.jsx
 * Displays attrition risk with confidence score and trend reasons.
 * 
 * Placement: src/components/workforce/AttritionCard.jsx
 */

import React from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip,
  LinearProgress, List, ListItem, ListItemIcon, ListItemText,
  Skeleton, Avatar, Grid,
} from '@mui/material';
import {
  ExitToApp     as ExitIcon,
  FiberManualRecord as DotIcon,
} from '@mui/icons-material';

const LEVEL_CONFIG = {
  LOW:         { color: '#22c55e', bg: '#f0fdf4', label: 'Low Risk'    },
  MEDIUM:      { color: '#f97316', bg: '#fff7ed', label: 'Medium Risk' },
  HIGH:        { color: '#ef4444', bg: '#fef2f2', label: 'High Risk'   },
  UNAVAILABLE: { color: '#9ca3af', bg: '#f9fafb', label: 'Unavailable' },
};

export default function AttritionCard({ data, loading }) {

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="60%" height={32} />
          <Skeleton variant="rectangular" height={12} sx={{ my: 2, borderRadius: 6 }} />
          {[1, 2].map(i => (
            <Skeleton key={i} variant="text" width={`${65 + i * 10}%`} sx={{ mt: 1 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No attrition data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const level  = data.level || 'UNAVAILABLE';
  const config = LEVEL_CONFIG[level] || LEVEL_CONFIG.UNAVAILABLE;
  const score  = data.attritionRisk ?? 0;
  const conf   = data.confidence    ?? 0;

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
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: config.bg, width: 44, height: 44 }}>
            <ExitIcon sx={{ color: config.color, fontSize: 24 }} />
          </Avatar>
        }
        title={<Typography variant="h6" fontWeight={700}>Attrition Risk</Typography>}
        subheader={`Employee #${data.employeeId}`}
        action={
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', mt: 1, gap: 0.5 }}>
            <Chip
              label={config.label}
              size="small"
              sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700, border: `1px solid ${config.color}` }}
            />
            <Typography variant="caption" color="text.disabled">
              {conf}% confidence
            </Typography>
          </Box>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0, px: 3, pb: 3 }}>

        {/* ── Score Display ──────────────────────────────────────────────── */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary" fontWeight={600}>
              Attrition Risk Score
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
              '& .MuiLinearProgress-bar': { borderRadius: 5, bgcolor: config.color },
            }}
          />
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
            <Typography variant="caption" color="text.disabled">0 — Engaged</Typography>
            <Typography variant="caption" color="text.disabled">100 — At Risk</Typography>
          </Box>
        </Box>

        {/* ── Reasons ────────────────────────────────────────────────────── */}
        {data.reasons?.length > 0 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ mb: 1 }}>
              Trend Signals
            </Typography>
            <List dense disablePadding>
              {data.reasons.map((r, i) => (
                <ListItem key={i} disableGutters sx={{ py: 0.3 }}>
                  <ListItemIcon sx={{ minWidth: 20 }}>
                    <DotIcon sx={{ fontSize: 10, color: config.color }} />
                  </ListItemIcon>
                  <ListItemText
                    primary={r}
                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {/* ── Factor Breakdown ───────────────────────────────────────────── */}
        {data.factorScores && (
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="caption" color="text.disabled" fontWeight={600}>
              SIGNAL BREAKDOWN
            </Typography>
            <Grid container spacing={1} sx={{ mt: 0.5 }}>
              {Object.entries(data.factorScores).map(([key, val]) => (
                <Grid item xs={6} key={key}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                      {key.replace(/_/g, ' ')}
                    </Typography>
                    <Typography
                      variant="caption"
                      fontWeight={700}
                      color={val >= 70 ? 'error.main' : val >= 40 ? 'warning.main' : 'success.main'}
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