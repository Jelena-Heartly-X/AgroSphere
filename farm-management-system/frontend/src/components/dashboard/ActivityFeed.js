import React from 'react';
import { useState } from 'react';
import {
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import {
  ShoppingCart as OrderIcon,
  Inventory as ProductIcon,
  Assignment as TaskIcon,
  Payment as PaymentIcon,
} from '@mui/icons-material';

const getActivityIcon = (type) => {
  switch (type) {
    case 'order':
      return <OrderIcon color="primary" />;
    case 'product':
      return <ProductIcon color="secondary" />;
    case 'task':
      return <TaskIcon color="warning" />;
    case 'payment':
      return <PaymentIcon color="success" />;
    default:
      return null;
  }
};

const ActivityFeed = ({ activities }) => {
  return (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Typography variant="h6" gutterBottom>
        Recent Activity
      </Typography>
      <List>
        {activities.map((activity, index) => (
          <React.Fragment key={activity.id}>
            <ListItem>
              <ListItemIcon>{getActivityIcon(activity.type)}</ListItemIcon>
              <ListItemText
                primary={activity.title}
                secondary={
                  <>
                    <Typography component="span" variant="body2" color="textSecondary">
                      {new Date(activity.timestamp).toLocaleString()}
                    </Typography>
                    <br />
                    {activity.description}
                  </>
                }
              />
            </ListItem>
            {index < activities.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </Paper>
  );
};

export default ActivityFeed;