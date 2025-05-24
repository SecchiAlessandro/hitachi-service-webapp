import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  Avatar,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  Divider,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  LinearProgress
} from '@mui/material';
import {
  Person,
  Edit,
  Save,
  Cancel,
  CheckCircle,
  Schedule,
  TrendingUp,
  Security,
  Notifications
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [statsLoading, setStatsLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0
  });

  // Form states
  const [profileForm, setProfileForm] = useState({
    name: '',
    email: '',
    department: '',
    customer_name: '',
    phone: ''
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        email: user.email || '',
        department: user.department || '',
        customer_name: user.customer_name || '',
        phone: user.phone || ''
      });
    }
    fetchUserStats();
  }, [user]);

  const fetchUserStats = async () => {
    try {
      setStatsLoading(true);
      const token = localStorage.getItem('token');
      
      // Use the dedicated stats endpoint for better performance
      const response = await axios.get('/api/tasks/stats/overview', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats({
        totalTasks: response.data.total,
        completedTasks: response.data.completed,
        pendingTasks: response.data.pending,
        overdueTasks: response.data.overdue
      });
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
      // Fallback: try to fetch tasks and calculate stats manually
      try {
        const token = localStorage.getItem('token');
        const tasksResponse = await axios.get('/api/tasks', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const tasks = tasksResponse.data.tasks || tasksResponse.data;
        const now = new Date();
        
        const pending = tasks.filter(task => task.status === 'pending');
        const completed = tasks.filter(task => task.status === 'completed');
        const overdue = pending.filter(task => new Date(task.due_date) < now);
        
        setStats({
          totalTasks: tasks.length,
          completedTasks: completed.length,
          pendingTasks: pending.length,
          overdueTasks: overdue.length
        });
      } catch (fallbackErr) {
        console.error('Failed to fetch tasks for fallback stats:', fallbackErr);
      }
    } finally {
      setStatsLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.put('/api/auth/profile', profileForm, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      updateUser(response.data.user);
      setSuccess('Profile updated successfully');
      setEditDialogOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      await axios.put('/api/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setSuccess('Password changed successfully');
      setPasswordDialogOpen(false);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getCompletionRate = () => {
    if (stats.totalTasks === 0) return 0;
    return Math.round((stats.completedTasks / stats.totalTasks) * 100);
  };

  return (
    <Box sx={{ flexGrow: 1, p: 3 }}>
      {/* Header */}
      <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold', mb: 3 }}>
        User Profile
      </Typography>

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

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent sx={{ textAlign: 'center' }}>
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  mx: 'auto',
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user?.name ? getInitials(user.name) : <Person />}
              </Avatar>
              
              <Typography variant="h5" component="h2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {user?.name || 'User Name'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                {user?.department || 'Service Department'}
              </Typography>
              
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {user?.email}
              </Typography>
              
              <Button
                variant="contained"
                startIcon={<Edit />}
                onClick={() => setEditDialogOpen(true)}
                fullWidth
              >
                Edit Profile
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" component="h3">
                  Task Statistics
                </Typography>
                <Button
                  size="small"
                  onClick={fetchUserStats}
                  disabled={statsLoading}
                  sx={{ minWidth: 'auto', px: 1 }}
                >
                  <TrendingUp fontSize="small" />
                </Button>
              </Box>
              
              <List dense>
                <ListItem>
                  <ListItemIcon>
                    <CheckCircle color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Completed"
                    secondary={stats.completedTasks}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <Schedule color="warning" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pending"
                    secondary={stats.pendingTasks}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemIcon>
                    <TrendingUp color="error" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Overdue"
                    secondary={stats.overdueTasks}
                  />
                </ListItem>
              </List>
              
              <Divider sx={{ my: 2 }} />
              
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" color="primary.main">
                  {getCompletionRate()}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completion Rate
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Detailed Information */}
        <Grid item xs={12} md={8}>
          {/* Account Information */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Account Information
              </Typography>
              
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={user?.name || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Email Address"
                    value={user?.email || ''}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Site Location"
                    value={user?.department || 'Service Department'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    value={user?.customer_name || 'Service Department'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Phone Number"
                    value={user?.phone || 'Not provided'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Member Since"
                    value={user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Last Login"
                    value={user?.last_login ? new Date(user.last_login).toLocaleDateString() : 'N/A'}
                    InputProps={{ readOnly: true }}
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Security Settings */}
          <Card>
            <CardContent>
              <Typography variant="h6" component="h3" sx={{ mb: 2 }}>
                Security Settings
              </Typography>
              
              <List>
                <ListItem>
                  <ListItemIcon>
                    <Security color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Password"
                    secondary="Change your account password"
                  />
                  <Button
                    variant="outlined"
                    onClick={() => setPasswordDialogOpen(true)}
                  >
                    Change Password
                  </Button>
                </ListItem>
                
                <Divider />
                
                <ListItem>
                  <ListItemIcon>
                    <Notifications color="primary" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive email reminders for upcoming tasks"
                  />
                  <Chip label="Enabled" color="success" />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Profile Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={profileForm.name}
                onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Site Location"
                value={profileForm.department}
                onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Customer Name"
                value={profileForm.customer_name}
                onChange={(e) => setProfileForm({ ...profileForm, customer_name: e.target.value })}
                helperText="This will appear instead of 'Service Department' in the sidebar"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleUpdateProfile}
            variant="contained"
            startIcon={<Save />}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Change Password Dialog */}
      <Dialog open={passwordDialogOpen} onClose={() => setPasswordDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Current Password"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="New Password"
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                helperText="Password must be at least 6 characters long"
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Confirm New Password"
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                error={passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''}
                helperText={
                  passwordForm.newPassword !== passwordForm.confirmPassword && passwordForm.confirmPassword !== ''
                    ? 'Passwords do not match'
                    : ''
                }
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordDialogOpen(false)} startIcon={<Cancel />}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            startIcon={<Save />}
            disabled={loading || !passwordForm.currentPassword || !passwordForm.newPassword || passwordForm.newPassword !== passwordForm.confirmPassword}
          >
            {loading ? 'Changing...' : 'Change Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {loading && (
        <Box sx={{ width: '100%', mt: 2 }}>
          <LinearProgress />
        </Box>
      )}
    </Box>
  );
};

export default ProfilePage; 