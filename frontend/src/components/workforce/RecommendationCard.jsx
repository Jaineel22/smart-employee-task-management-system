/**
 * RecommendationCard.jsx
 * Displays AI-generated prioritized recommendations.
 * 
 * Placement: src/components/workforce/RecommendationCard.jsx
 */

import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip,
  List, ListItem, ListItemIcon, ListItemText,
  Avatar, Collapse, Button, Skeleton, LinearProgress,
} from '@mui/material';
import {
  Lightbulb as LightIcon,
  CheckCircle as CheckIcon,
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp   as UpIcon,
  TrendingUp        as ImpIcon,
} from '@mui/icons-material';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#ef4444', bg: '#fef2f2', label: 'High Priority'   },
  MEDIUM: { color: '#f97316', bg: '#fff7ed', label: 'Medium Priority' },
  LOW:    { color: '#22c55e', bg: '#f0fdf4', label: 'Low Priority'    },
};

export default function RecommendationCard({ data, loading }) {

  const [expanded, setExpanded] = useState(true);

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="50%" height={36} />
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} variant="text" width={`${60 + i * 8}%`} sx={{ mt: 1.5 }} />
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">No recommendations available</Typography>
        </CardContent>
      </Card>
    );
  }

  const priority = data.priority || 'LOW';
  const config   = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
  const recs     = data.recommendations || [];
  const improvement = data.expectedImprovement ?? 0;

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
          <Avatar sx={{ bgcolor: config.bg, width: 44, height: 44 }}>
            <LightIcon sx={{ color: config.color, fontSize: 26 }} />
          </Avatar>
        }
        title={<Typography variant="h6" fontWeight={700}>AI Recommendations</Typography>}
        subheader={`${recs.length} personalized actions for Employee #${data.employeeId}`}
        action={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, mr: 1 }}>
            <Chip
              label={config.label}
              size="small"
              sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700, border: `1px solid ${config.color}` }}
            />
            <Button
              size="small"
              onClick={() => setExpanded(!expanded)}
              endIcon={expanded ? <UpIcon /> : <DownIcon />}
              sx={{ textTransform: 'none' }}
            >
              {expanded ? 'Collapse' : 'Expand'}
            </Button>
          </Box>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>

        {/* ── Expected Improvement Banner ────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex', alignItems: 'center', gap: 2,
            p: 2, borderRadius: 2,
            bgcolor: improvement > 0 ? '#f0fdf4' : '#f9fafb',
            mb: 2,
          }}
        >
          <ImpIcon sx={{ color: improvement > 0 ? '#22c55e' : '#9ca3af' }} />
          <Box>
            <Typography variant="body2" fontWeight={600} color="text.primary">
              Expected Productivity Improvement
            </Typography>
            <Typography variant="caption" color="text.secondary">
              If all recommendations are followed consistently
            </Typography>
          </Box>
          <Typography variant="h5" fontWeight={900} color={improvement > 0 ? '#22c55e' : '#9ca3af'} sx={{ ml: 'auto' }}>
            +{improvement}%
          </Typography>
        </Box>

        {/* ── Improvement Progress ───────────────────────────────────────── */}
        <LinearProgress
          variant="determinate"
          value={Math.min(improvement * 4, 100)}
          sx={{
            height: 6,
            borderRadius: 3,
            mb: 3,
            bgcolor: '#f0fdf4',
            '& .MuiLinearProgress-bar': { bgcolor: '#22c55e', borderRadius: 3 },
          }}
        />

        {/* ── Recommendation List ────────────────────────────────────────── */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <List disablePadding>
            {recs.map((rec, i) => (
              <ListItem
                key={i}
                disableGutters
                sx={{
                  py: 1.2,
                  px: 2,
                  mb: 1,
                  borderRadius: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  alignItems: 'flex-start',
                  transition: 'background 0.15s',
                  '&:hover': { bgcolor: 'action.hover' },
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, mt: 0.3 }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: `${config.color}15`, fontSize: 11 }}>
                    <Typography variant="caption" fontWeight={800} color={config.color}>
                      {i + 1}
                    </Typography>
                  </Avatar>
                </ListItemIcon>
                <ListItemText
                  primary={rec}
                  primaryTypographyProps={{ variant: 'body2', color: 'text.primary', lineHeight: 1.5 }}
                />
                <CheckIcon sx={{ color: 'divider', fontSize: 18, mt: 0.3, ml: 1 }} />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* ── Footer ────────────────────────────────────────────────────── */}
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            🤖 Generated by AI Recommendation Engine • Based on real-time metrics
          </Typography>
        </Box>

      </CardContent>
    </Card>
  );
}