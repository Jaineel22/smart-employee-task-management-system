/**
 * GrowthForecastCard.jsx
 * Displays productivity forecast with trend chart and improvement metrics.
 * 
 * Placement: src/components/workforce/GrowthForecastCard.jsx
 */

import React from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip,
  Grid, Avatar, Skeleton,
} from '@mui/material';
import {
  TrendingUp   as UpIcon,
  TrendingDown as DownIcon,
  TrendingFlat as FlatIcon,
  ShowChart    as ChartIcon,
} from '@mui/icons-material';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';

const TREND_CONFIG = {
  IMPROVING:         { color: '#22c55e', label: 'Improving',   Icon: UpIcon   },
  STABLE:            { color: '#3b82f6', label: 'Stable',      Icon: FlatIcon },
  DECLINING:         { color: '#ef4444', label: 'Declining',   Icon: DownIcon },
  INSUFFICIENT_DATA: { color: '#9ca3af', label: 'No Trend',    Icon: FlatIcon },
  UNAVAILABLE:       { color: '#9ca3af', label: 'Unavailable', Icon: FlatIcon },
};

export default function GrowthForecastCard({ data, loading }) {

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="50%" height={36} />
          <Skeleton variant="rectangular" height={180} sx={{ mt: 2, borderRadius: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No forecast data available</Typography>
        </CardContent>
      </Card>
    );
  }

  const trend  = data.trendDirection || 'UNAVAILABLE';
  const cfg    = TREND_CONFIG[trend] || TREND_CONFIG.UNAVAILABLE;
  const { Icon } = cfg;

  // ── Build Chart Data ─────────────────────────────────────────────────────
  const history  = data.historicalData   || [];
  const chartData = [
    ...history.map((v, i) => ({
      name:   `M${i - history.length + 1}`,
      actual: v,
    })),
    { name: '+1M', forecast: data.predictedProductivity1Month  },
    { name: '+3M', forecast: data.predictedProductivity3Months },
    { name: '+6M', forecast: data.predictedProductivity6Months },
  ];

  const imp3m   = data.improvement3Months ?? 0;
  const imp6m   = data.improvement6Months ?? 0;
  const impColor3 = imp3m >= 0 ? '#22c55e' : '#ef4444';
  const impColor6 = imp6m >= 0 ? '#22c55e' : '#ef4444';

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        transition: 'transform 0.2s, box-shadow 0.2s',
        '&:hover': { transform: 'translateY(-2px)', boxShadow: 6 },
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: `${cfg.color}15`, width: 44, height: 44 }}>
            <ChartIcon sx={{ color: cfg.color, fontSize: 26 }} />
          </Avatar>
        }
        title={<Typography variant="h6" fontWeight={700}>Growth Forecast</Typography>}
        subheader={`${data.dataPoints ?? 0} historical data points • Confidence: ${data.confidence ?? 0}%`}
        action={
          <Chip
            icon={<Icon sx={{ fontSize: 16 }} />}
            label={cfg.label}
            size="small"
            sx={{
              bgcolor: `${cfg.color}15`,
              color:   cfg.color,
              fontWeight: 700,
              mt: 1, mr: 1,
            }}
          />
        }
      />

      <CardContent sx={{ pt: 0 }}>

        {/* ── Metric Summary ─────────────────────────────────────────────── */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Current',   value: data.currentProductivity          ?? 0, color: '#6b7280' },
            { label: '+1 Month',  value: data.predictedProductivity1Month  ?? 0, color: cfg.color },
            { label: '+3 Months', value: data.predictedProductivity3Months ?? 0, color: cfg.color, diff: imp3m, diffColor: impColor3 },
            { label: '+6 Months', value: data.predictedProductivity6Months ?? 0, color: cfg.color, diff: imp6m, diffColor: impColor6 },
          ].map(({ label, value, color, diff, diffColor }) => (
            <Grid item xs={6} sm={3} key={label}>
              <Box
                sx={{
                  p: 2, borderRadius: 2,
                  border: '1px solid', borderColor: 'divider',
                  textAlign: 'center',
                }}
              >
                <Typography variant="h4" fontWeight={800} color={color}>
                  {value}
                  <Typography component="span" variant="caption" color="text.disabled">%</Typography>
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {label}
                </Typography>
                {diff !== undefined && (
                  <Chip
                    label={`${diff >= 0 ? '+' : ''}${diff}%`}
                    size="small"
                    sx={{ mt: 0.5, height: 18, fontSize: 10, bgcolor: `${diffColor}15`, color: diffColor, fontWeight: 700 }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>

        {/* ── Area Chart ────────────────────────────────────────────────── */}
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="actualGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}   />
                </linearGradient>
                <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={cfg.color} stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v, n) => [`${v}%`, n === 'actual' ? 'Actual' : 'Forecast']} />
              <ReferenceLine x="+1M" stroke="#e5e7eb" strokeDasharray="4 4" label={{ value: 'Forecast →', fontSize: 10 }} />
              <Area type="monotone" dataKey="actual"   stroke="#3b82f6" fill="url(#actualGrad)"   strokeWidth={2} connectNulls />
              <Area type="monotone" dataKey="forecast" stroke={cfg.color} fill="url(#forecastGrad)" strokeWidth={2} strokeDasharray="5 5" connectNulls />
            </AreaChart>
          </ResponsiveContainer>
        </Box>

        {/* ── Trend Metadata ─────────────────────────────────────────────── */}
        <Box sx={{ display: 'flex', gap: 2, mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            Monthly Trend: <strong style={{ color: cfg.color }}>
              {data.trendPerMonth >= 0 ? '+' : ''}{data.trendPerMonth ?? 0}%
            </strong>
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Smoothed: <strong>{data.smoothedProductivity ?? 0}%</strong>
          </Typography>
          <Typography variant="caption" color="text.disabled">
            Model Confidence: <strong>{data.confidence ?? 0}%</strong>
          </Typography>
        </Box>

      </CardContent>
    </Card>
  );
}