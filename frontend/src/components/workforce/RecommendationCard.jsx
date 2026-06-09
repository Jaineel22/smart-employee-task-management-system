/**
 * RecommendationCard.jsx
 * Displays AI-generated prioritized recommendations.
 * 
 * Placement: src/components/workforce/RecommendationCard.jsx
 */

import React, { useState } from 'react';
import {
  Card, CardContent, CardHeader, Box, Typography, Chip,
  Avatar, Collapse, Button, Skeleton,
} from '@mui/material';
import {
  Lightbulb as LightIcon,
  KeyboardArrowDown as DownIcon,
  KeyboardArrowUp   as UpIcon,
} from '@mui/icons-material';

const PRIORITY_CONFIG = {
  HIGH:   { color: '#ef4444', bg: '#fef2f2', label: 'High Priority'   },
  MEDIUM: { color: '#f97316', bg: '#fff7ed', label: 'Medium Priority' },
  LOW:    { color: '#22c55e', bg: '#f0fdf4', label: 'Low Priority'    },
};

export default function RecommendationCard({ data, loading }) {

  const [expanded, setExpanded] = useState(false);

  if (loading) {
    return (
      <Card elevation={2} sx={{ borderRadius: 3 }}>
        <CardContent sx={{ p: 3 }}>
          <Skeleton variant="text" width="50%" height={36} />
          <Skeleton variant="text" width="80%" height={24} sx={{ mt: 1 }} />
          <Skeleton variant="text" width="60%" height={24} sx={{ mt: 1 }} />
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

  // The data object itself is the recommendation (single item)
  const message = data.message;
  const category = data.category;
  const priority = data.priority || 'LOW';
  const impactScore = data.impactScore;
  const confidence = data.confidence;
  const generatedAt = data.generatedAt;
  
  const config = PRIORITY_CONFIG[priority] || PRIORITY_CONFIG.LOW;

  // Get color for priority badge
  const getPriorityColor = () => {
    switch (priority) {
      case 'HIGH': return '#ef4444';
      case 'MEDIUM': return '#f97316';
      default: return '#22c55e';
    }
  };

  const getPriorityBg = () => {
    switch (priority) {
      case 'HIGH': return '#fef2f2';
      case 'MEDIUM': return '#fff7ed';
      default: return '#f0fdf4';
    }
  };

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
        title={<Typography variant="h6" fontWeight={700}>AI Recommendation</Typography>}
        subheader={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Chip
              label={config.label}
              size="small"
              sx={{ bgcolor: config.bg, color: config.color, fontWeight: 700, border: `1px solid ${config.color}` }}
            />
            {category && (
              <Chip
                label={category.replace(/_/g, ' ')}
                size="small"
                sx={{ bgcolor: '#f3f4f6', color: '#6b7280' }}
              />
            )}
          </Box>
        }
        action={
          <Button
            size="small"
            onClick={() => setExpanded(!expanded)}
            endIcon={expanded ? <UpIcon /> : <DownIcon />}
            sx={{ textTransform: 'none', mt: 1 }}
          >
            {expanded ? 'Hide Details' : 'Show Details'}
          </Button>
        }
        sx={{ pb: 1 }}
      />

      <CardContent sx={{ pt: 0 }}>

        {/* Recommendation Message */}
        <Box
          sx={{
            p: 2.5,
            borderRadius: 2,
            bgcolor: '#f8fafc',
            mb: 2,
            border: '1px solid #e2e8f0',
          }}
        >
          <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500, lineHeight: 1.5 }}>
            {message}
          </Typography>
        </Box>

        {/* Stats chips */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          {impactScore && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px' }}>
                Impact Score
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: getPriorityColor() }}>
                {impactScore}
              </Typography>
            </Box>
          )}
          {confidence && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px' }}>
                Confidence
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: '#3b82f6' }}>
                {confidence}%
              </Typography>
            </Box>
          )}
          {priority && (
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '10px' }}>
                Priority Level
              </Typography>
              <Typography variant="h6" fontWeight={700} sx={{ color: getPriorityColor() }}>
                {priority}
              </Typography>
            </Box>
          )}
        </Box>

        {/* Expandable details section */}
        <Collapse in={expanded} timeout="auto" unmountOnExit>
          <Box sx={{ mt: 2, pt: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Why this recommendation?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              This recommendation is generated based on your current performance metrics, 
              including productivity score, attendance rate, task completion, and workload analysis.
            </Typography>
            
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              What you can do:
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              • Review your current tasks and prioritize accordingly<br />
              • Update your daily work reports with detailed activities<br />
              • Communicate any blockers to your manager<br />
              • Track your progress regularly
            </Typography>

            {generatedAt && (
              <Typography variant="caption" color="text.disabled" display="block" sx={{ mt: 1 }}>
                Generated: {new Date(generatedAt).toLocaleString()}
              </Typography>
            )}
          </Box>
        </Collapse>

        {/* Footer */}
        <Box sx={{ mt: 2, pt: 1.5, borderTop: '1px solid', borderColor: 'divider' }}>
          <Typography variant="caption" color="text.disabled">
            🤖 Powered by AI Recommendation Engine • Based on real-time metrics
          </Typography>
        </Box>

      </CardContent>
    </Card>
  );
}