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

  // Handle both legacy and structured recommendation formats
  const isStructured = data.recommendations && Array.isArray(data.recommendations) && data.recommendations.length > 0 && data.recommendations[0].message;
  
  const priority = data.priority || data.overallPriority || 'LOW';
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;
  
  // For structured recommendations
  const structuredRecs = isStructured ? data.recommendations : [];
  // For legacy recommendations (array of strings)
  const legacyRecs = !isStructured && data.recommendations ? data.recommendations : [];
  const recs = legacyRecs;
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
        subheader={`${isStructured ? structuredRecs.length : recs.length} personalized actions for Employee #${data.employeeId}`}
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
        {!isStructured && (
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
        )}

        {/* ── Improvement Progress ───────────────────────────────────────── */}
        {!isStructured && (
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
        )}

        {/* ── Recommendation List ────────────────────────────────────────── */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          {isStructured ? (
            // Structured recommendations with message, category, priority, etc.
            <List disablePadding>
              {structuredRecs.map((rec, i) => (
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
                    flexDirection: 'column',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Box sx={{ display: 'flex', width: '100%', alignItems: 'flex-start' }}>
                    <ListItemIcon sx={{ minWidth: 36, mt: 0.3 }}>
                      <Avatar sx={{ width: 24, height: 24, bgcolor: `${config.color}15`, fontSize: 11 }}>
                        <Typography variant="caption" fontWeight={800} color={config.color}>
                          {i + 1}
                        </Typography>
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={rec.message}
                      primaryTypographyProps={{ variant: 'body2', color: 'text.primary', lineHeight: 1.5 }}
                    />
                    <CheckIcon sx={{ color: 'divider', fontSize: 18, mt: 0.3, ml: 1 }} />
                  </Box>
                  
                  {/* Recommendation metadata badges */}
                  <Box sx={{ display: 'flex', gap: 1, ml: 6, mt: 1, flexWrap: 'wrap' }}>
                    <Chip
                      label={rec.priority}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: '10px',
                        bgcolor: rec.priority === 'HIGH' ? '#fef2f2' : rec.priority === 'MEDIUM' ? '#fff7ed' : '#f0fdf4',
                        color: rec.priority === 'HIGH' ? '#ef4444' : rec.priority === 'MEDIUM' ? '#f97316' : '#22c55e',
                        fontWeight: 600,
                      }}
                    />
                    <Chip
                      label={rec.category?.replace(/_/g, ' ')}
                      size="small"
                      sx={{ height: 20, fontSize: '10px', bgcolor: '#f3f4f6', color: '#6b7280' }}
                    />
                    {rec.impactScore && (
                      <Chip
                        label={`Impact: ${rec.impactScore}`}
                        size="small"
                        sx={{ height: 20, fontSize: '10px', bgcolor: '#e0e7ff', color: '#4338ca' }}
                      />
                    )}
                    {rec.confidence && (
                      <Chip
                        label={`Confidence: ${rec.confidence}%`}
                        size="small"
                        sx={{ height: 20, fontSize: '10px', bgcolor: '#dcfce7', color: '#166534' }}
                      />
                    )}
                  </Box>
                </ListItem>
              ))}
            </List>
          ) : (
            // Legacy recommendations (simple strings)
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
          )}
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