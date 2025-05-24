import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardActions,
  Grid,
  Chip,
  IconButton,
  Button,
  TextField,
  InputAdornment,
  Paper,
  Alert,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import {
  CheckCircle,
  Schedule,
  Search,
  Refresh,
  Delete,
  Undo,
  Assignment
} from '@mui/icons-material';
import axios from 'axios';

const CompletedTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [filteredTasks, setFilteredTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  const fetchCompletedTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/tasks', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter only completed tasks
      const completedTasks = response.data.tasks.filter(task => task.status === 'completed');
      setTasks(completedTasks);
    } catch (err) {
      setError('Failed to load completed tasks');
      console.error('Completed tasks fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompletedTasks();
  }, []);

  useEffect(() => {
    let filtered = tasks;
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(task =>
        task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.equipment_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredTasks(filtered);
  }, [tasks, searchTerm]);

  const handleReopenTask = async (task) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/tasks/${task.id}/status`, 
        { status: 'pending' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess('Task reopened successfully');
      fetchCompletedTasks();
    } catch (err) {
      setError('Failed to reopen task');
      console.error('Reopen task error:', err);
    }
  };

  const handleDeleteTask = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/tasks/${taskToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Task deleted successfully');
      setDeleteConfirmOpen(false);
      setTaskToDelete(null);
      fetchCompletedTasks();
    } catch (err) {
      setError('Failed to delete task');
      console.error('Delete task error:', err);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'error';
      case 'medium': return 'warning';
      case 'low': return 'success';
      default: return 'default';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getCompletionTime = (dueDate, completedDate) => {
    const due = new Date(dueDate);
    const completed = new Date(completedDate);
    const diffTime = completed - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { text: `${Math.abs(diffDays)} days early`, color: 'success' };
    } else if (diffDays === 0) {
      return { text: 'On time', color: 'success' };
    } else {
      return { text: `${diffDays} days late`, color: 'error' };
    }
  };

  if (loading) {
    return (
      <Box sx={{ width: '100%', mt: 2 }}>
        <LinearProgress />
        <Typography variant="h6" sx={{ mt: 2, textAlign: 'center' }}>
          Loading completed tasks...
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Completed Tasks
        </Typography>
        <Tooltip title="Refresh Tasks">
          <IconButton onClick={fetchCompletedTasks} color="primary">
            <Refresh />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Search and Stats */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              placeholder="Search completed tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="h6" color="success.main">
                {filteredTasks.length} Completed Task(s)
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {tasks.length} total completed
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Completed Tasks Grid */}
      {filteredTasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            {tasks.length === 0 ? 'No completed tasks yet' : 'No tasks match your search'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            {tasks.length === 0 
              ? 'Complete some tasks to see them here' 
              : 'Try adjusting your search terms'
            }
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {filteredTasks.map((task) => {
            const completion = getCompletionTime(task.due_date, task.updated_at);
            
            return (
              <Grid item xs={12} sm={6} md={4} key={task.id}>
                <Card 
                  sx={{ 
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    border: 1,
                    borderColor: 'success.main',
                    bgcolor: 'success.light',
                    opacity: 0.9
                  }}
                >
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                      <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }}>
                        {task.title}
                      </Typography>
                      <Chip
                        label="Completed"
                        color="success"
                        size="small"
                        icon={<CheckCircle />}
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {task.description}
                    </Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Equipment:</strong> {task.equipment_type}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Location:</strong> {task.location}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Due Date:</strong> {formatDate(task.due_date)}
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>Completed:</strong> {formatDate(task.updated_at)}
                      </Typography>
                    </Box>
                    
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={task.priority}
                        color={getPriorityColor(task.priority)}
                        size="small"
                      />
                      <Chip
                        label={completion.text}
                        color={completion.color}
                        size="small"
                      />
                    </Box>
                  </CardContent>
                  
                  <CardActions>
                    <Button
                      size="small"
                      startIcon={<Undo />}
                      onClick={() => handleReopenTask(task)}
                      color="warning"
                    >
                      Reopen
                    </Button>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setTaskToDelete(task);
                        setDeleteConfirmOpen(true);
                      }}
                      color="error"
                    >
                      <Delete />
                    </IconButton>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Statistics Summary */}
      {tasks.length > 0 && (
        <Paper sx={{ p: 2, mt: 3 }}>
          <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
            Completion Statistics
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {tasks.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Completed
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="success.main">
                  {tasks.filter(task => {
                    const completion = getCompletionTime(task.due_date, task.updated_at);
                    return completion.color === 'success';
                  }).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  On Time / Early
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="error.main">
                  {tasks.filter(task => {
                    const completion = getCompletionTime(task.due_date, task.updated_at);
                    return completion.color === 'error';
                  }).length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Late
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {Math.round((tasks.filter(task => {
                    const completion = getCompletionTime(task.due_date, task.updated_at);
                    return completion.color === 'success';
                  }).length / tasks.length) * 100)}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Success Rate
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to permanently delete the completed task "{taskToDelete?.title}"? 
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleDeleteTask} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompletedTasksPage; 