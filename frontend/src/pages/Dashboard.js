import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Paper,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Assignment,
  CheckCircle,
  Warning,
  Schedule,
  TrendingUp,
  Refresh,
  Add,
  PlayArrow
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    overdueTasks: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch dashboard statistics from dedicated endpoint
      const statsResponse = await axios.get('/api/tasks/stats/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        totalTasks: statsResponse.data.total,
        pendingTasks: statsResponse.data.pending,
        completedTasks: statsResponse.data.completed,
        overdueTasks: statsResponse.data.overdue
      });
      
      // Fetch tasks for recent and upcoming lists
      const tasksResponse = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tasks = tasksResponse.data.tasks;
      const now = new Date();
      
      // Get recent completed tasks (last 5)
      const recentCompleted = tasks
        .filter(task => task.status === 'completed')
        .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
        .slice(0, 5);
      setRecentTasks(recentCompleted);
      
      // Get upcoming tasks (next 5 by due date, pending only)
      const upcoming = tasks
        .filter(task => task.status === 'pending')
        .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
        .slice(0, 5);
      setUpcomingTasks(upcoming);
      
    } catch (err) {
      setError('Failed to load dashboard data');
      console.error('Dashboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const getTaskPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const getDaysUntilDue = (dueDate) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diffTime = due - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading dashboard...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Service Dashboard
        </Typography>
        <Box>
          <Tooltip title="Refresh Data">
            <IconButton onClick={fetchDashboardData} color="primary">
              <Refresh />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => navigate('/tasks')}
            sx={{ ml: 1 }}
          >
            New Task
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Statistics Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'warning.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Schedule sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.pendingTasks}
                  </Typography>
                  <Typography variant="body2">
                    Pending Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'success.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <CheckCircle sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.completedTasks}
                  </Typography>
                  <Typography variant="body2">
                    Completed Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={4}>
          <Card sx={{ bgcolor: 'error.main', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Warning sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="h4" component="div">
                    {stats.overdueTasks}
                  </Typography>
                  <Typography variant="body2">
                    Overdue Tasks
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={3}>
        {/* Upcoming Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Upcoming Tasks
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/tasks')}
                endIcon={<PlayArrow />}
              >
                View All
              </Button>
            </Box>
            
            {upcomingTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                No upcoming tasks
              </Typography>
            ) : (
              <List>
                {upcomingTasks.map((task) => {
                  const daysUntil = getDaysUntilDue(task.due_date);
                  const isOverdue = daysUntil < 0;
                  const isUrgent = daysUntil <= 3 && daysUntil >= 0;
                  
                  return (
                    <ListItem
                      key={task.id}
                      sx={{
                        border: 1,
                        borderColor: isOverdue ? 'error.main' : isUrgent ? 'warning.main' : 'divider',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: isOverdue ? 'error.light' : isUrgent ? 'warning.light' : 'background.paper'
                      }}
                    >
                      <ListItemIcon>
                        <Assignment color={isOverdue ? 'error' : isUrgent ? 'warning' : 'primary'} />
                      </ListItemIcon>
                      <ListItemText
                        primary={task.title}
                        secondary={
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Due: {formatDate(task.due_date)}
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                              <Chip
                                label={task.priority}
                                size="small"
                                color={getTaskPriorityColor(task.priority)}
                              />
                              <Chip
                                label={isOverdue ? `${Math.abs(daysUntil)} days overdue` : `${daysUntil} days left`}
                                size="small"
                                color={isOverdue ? 'error' : isUrgent ? 'warning' : 'default'}
                              />
                            </Box>
                          </Box>
                        }
                      />
                    </ListItem>
                  );
                })}
              </List>
            )}
          </Paper>
        </Grid>

        {/* Recent Completed Tasks */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: '400px', overflow: 'auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6" component="h2">
                Recently Completed
              </Typography>
              <Button
                size="small"
                onClick={() => navigate('/completed')}
                endIcon={<PlayArrow />}
              >
                View All
              </Button>
            </Box>
            
            {recentTasks.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                No completed tasks yet
              </Typography>
            ) : (
              <List>
                {recentTasks.map((task) => (
                  <ListItem
                    key={task.id}
                    sx={{
                      border: 1,
                      borderColor: 'success.main',
                      borderRadius: 1,
                      mb: 1,
                      bgcolor: 'success.light'
                    }}
                  >
                    <ListItemIcon>
                      <CheckCircle color="success" />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={
                        <Box>
                          <Typography variant="body2" color="text.secondary">
                            Completed: {formatDate(task.updated_at)}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                            <Chip
                              label={task.priority}
                              size="small"
                              color={getTaskPriorityColor(task.priority)}
                            />
                            <Chip
                              label="Completed"
                              size="small"
                              color="success"
                            />
                          </Box>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper sx={{ p: 2, mt: 3 }}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<Assignment />}
              onClick={() => navigate('/tasks')}
            >
              View All Tasks
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<CheckCircle />}
              onClick={() => navigate('/completed')}
            >
              Completed Tasks
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="outlined"
              startIcon={<TrendingUp />}
              onClick={() => navigate('/profile')}
            >
              View Profile
            </Button>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button
              fullWidth
              variant="contained"
              startIcon={<Add />}
              onClick={() => navigate('/tasks')}
            >
              Create New Task
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
};

export default Dashboard; 