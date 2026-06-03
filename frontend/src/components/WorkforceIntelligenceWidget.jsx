/**
 * WorkforceIntelligenceWidget.jsx
 * 
 * Compact widget for Manager and Employee dashboards.
 * Shows key AI-4 metrics at a glance with navigation to full page.
 * 
 * Placement: src/components/dashboard/WorkforceIntelligenceWidget.jsx
 * 
 * Usage in Manager Dashboard:
 *   <WorkforceIntelligenceWidget role="MANAGER" employeeId={user.id} />
 * 
 * Usage in Employee Dashboard:
 *   <WorkforceIntelligenceWidget role="EMPLOYEE" employeeId={user.id} />
 */

import React, { useState, useEffect } from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Grid,
  Chip, Skeleton, Button, Divider, Avatar, LinearProgress,
} from '@mui/material';
import {
  Psychology    as AIIcon,
  ArrowForward  as ArrowIcon,
  LocalFireDepartment as BurnIcon,
  ExitToApp     as AttrIcon,
  TrendingUp    as TrendIcon,
  Lightbulb     as LightIcon,
  Groups        as TeamIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE = 'http://localhost:8080/api/ai';

const RISK_COLOR = {
  LOW:         '#22c55e',
  MEDIUM:      '#f97316',
  HIGH:        '#ef4444',
  UNAVAILABLE: '#9ca3af',
};

export default function WorkforceIntelligenceWidget({ role, employeeId }) {
  const navigate = useNavigate();
  const isManager = role === 'MANAGER' || role === 'ADMIN';

  const [data,    setData]    = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${localStorage.getItem('token')}` };

    Promise.allSettled([
      axios.get(`${API_BASE}/burnout/${employeeId}`,   { headers }),
      axios.get(`${API_BASE}/attrition/${employeeId}`, { headers }),
      axios.get(`${API_BASE}/forecast/${employeeId}`,  { headers }),
    ]).then(([b, a, f]) => {
      setData({
        burnout:  b.status === 'fulfilled' ? b.value.data : null,
        attrition:a.status === 'fulfilled' ? a.value.data : null,
        forecast: f.status === 'fulfilled' ? f.value.data : null,
      });
    }).finally(() => setLoading(false));
  }, [employeeId]);

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 2 }}>
          <Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
          <Grid container spacing={1}>
            {[1,2,3].map(i => (
              <Grid item xs={4} key={i}>
                <Skeleton variant="rectangular" height={64} sx={{ borderRadius: 2 }} />
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>
    );
  }

  const { burnout, attrition, forecast } = data;

  const metrics = isManager ? [
    {
      icon:  <BurnIcon sx={{ fontSize: 18 }} />,
      label: 'My Burnout',
      value: burnout?.burnoutRisk != null ? `${burnout.burnoutRisk}%` : 'N/A',
      color: RISK_COLOR[burnout?.level || 'UNAVAILABLE'],
      chip:  burnout?.level,
    },
    {
      icon:  <AttrIcon sx={{ fontSize: 18 }} />,
      label: 'Attrition',
      value: attrition?.attritionRisk != null ? `${attrition.attritionRisk}%` : 'N/A',
      color: RISK_COLOR[attrition?.level || 'UNAVAILABLE'],
      chip:  attrition?.level,
    },
    {
      icon:  <TrendIcon sx={{ fontSize: 18 }} />,
      label: '3M Forecast',
      value: forecast?.predictedProductivity3Months != null
        ? `${forecast.predictedProductivity3Months}%`
        : 'N/A',
      color: '#3b82f6',
      chip:  forecast?.trendDirection,
    },
  ] : [
    {
      icon:  <BurnIcon sx={{ fontSize: 18 }} />,
      label: 'Burnout Risk',
      value: burnout?.burnoutRisk != null ? `${burnout.burnoutRisk}%` : 'N/A',
      color: RISK_COLOR[burnout?.level || 'UNAVAILABLE'],
      chip:  burnout?.level,
    },
    {
      icon:  <AttrIcon sx={{ fontSize: 18 }} />,
      label: 'Attrition Risk',
      value: attrition?.attritionRisk != null ? `${attrition.attritionRisk}%` : 'N/A',
      color: RISK_COLOR[attrition?.level || 'UNAVAILABLE'],
      chip:  attrition?.level,
    },
    {
      icon:  <TrendIcon sx={{ fontSize: 18 }} />,
      label: 'Growth (3M)',
      value: forecast?.improvement3Months != null
        ? `${forecast.improvement3Months >= 0 ? '+' : ''}${forecast.improvement3Months}%`
        : 'N/A',
      color: (forecast?.improvement3Months ?? 0) >= 0 ? '#22c55e' : '#ef4444',
      chip:  forecast?.trendDirection,
    },
  ];

  return (
    <Card
      elevation={2}
      sx={{
        borderRadius: 3,
        transition: 'box-shadow 0.2s',
        '&:hover': { boxShadow: 6 },
      }}
    >
      <CardHeader
        avatar={
          <Avatar sx={{ bgcolor: '#eff6ff', width: 36, height: 36 }}>
            <AIIcon sx={{ color: '#3b82f6', fontSize: 20 }} />
          </Avatar>
        }
        title={
          <Typography variant="subtitle1" fontWeight={700}>
            Workforce Intelligence
          </Typography>
        }
        subheader={
          <Chip label="AI-4" size="small" color="primary" variant="outlined" sx={{ height: 18, fontSize: 10 }} />
        }
        action={
          <Button
            size="small"
            endIcon={<ArrowIcon sx={{ fontSize: 14 }} />}
            onClick={() => navigate('/workforce-intelligence')}
            sx={{ textTransform: 'none', fontSize: 12, mt: 0.5 }}
          >
            Full View
          </Button>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>
        <Grid container spacing={1.5}>
          {metrics.map(({ icon, label, value, color, chip }) => (
            <Grid item xs={4} key={label}>
              <Box
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: `${color}30`,
                  bgcolor: `${color}08`,
                  textAlign: 'center',
                  cursor: 'pointer',
                  '&:hover': { bgcolor: `${color}15` },
                }}
                onClick={() => navigate('/workforce-intelligence')}
              >
                <Box sx={{ color, mb: 0.3 }}>{icon}</Box>
                <Typography variant="h6" fontWeight={800} color={color} sx={{ lineHeight: 1.2 }}>
                  {value}
                </Typography>
                <Typography variant="caption" color="text.secondary" display="block">
                  {label}
                </Typography>
                {chip && chip !== 'UNAVAILABLE' && (
                  <Chip
                    label={chip}
                    size="small"
                    sx={{
                      mt: 0.3,
                      height: 16,
                      fontSize: 9,
                      bgcolor: `${RISK_COLOR[chip] || color}15`,
                      color:   RISK_COLOR[chip] || color,
                      fontWeight: 700,
                    }}
                  />
                )}
              </Box>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}