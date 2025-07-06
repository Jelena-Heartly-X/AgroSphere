import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  IconButton,
  CardActions,
} from '@mui/material';
import { ArrowForward as ArrowForwardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DashboardCard = ({ title, value, icon: Icon, color, link, subtitle }) => {
  const navigate = useNavigate();

  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography color="textSecondary" gutterBottom>
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="textSecondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {Icon && (
            <Box
              sx={{
                backgroundColor: `${color}.light`,
                borderRadius: '50%',
                padding: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Icon sx={{ color: `${color}.main` }} />
            </Box>
          )}
        </Box>
      </CardContent>
      {link && (
        <CardActions sx={{ mt: 'auto' }}>
          <IconButton size="small" onClick={() => navigate(link)}>
            <ArrowForwardIcon />
          </IconButton>
        </CardActions>
      )}
    </Card>
  );
};

export default DashboardCard;